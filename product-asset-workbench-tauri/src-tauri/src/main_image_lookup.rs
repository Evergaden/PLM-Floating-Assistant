use std::{collections::{BTreeSet, HashMap}, fs, io::{Cursor, Write}, path::{Path, PathBuf}};
use regex::Regex;
use serde::{Deserialize, Serialize};
use zip::{write::SimpleFileOptions, ZipWriter};

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MainImageRow {
    code: String,
    status: String,
    candidates: Vec<String>,
    selected_path: Option<String>,
}

fn folder_codes(name: &str, re: &Regex) -> BTreeSet<String> {
    re.find_iter(name)
        .filter(|m| !name[m.end()..].starts_with(|c: char| c.is_ascii_digit()))
        .map(|m| m.as_str().to_uppercase()).collect()
}

fn walk(folder: &Path, inherited: &BTreeSet<String>, re: &Regex, index: &mut HashMap<String, Vec<String>>) -> Result<(), String> {
    let entries = fs::read_dir(folder).map_err(|e| format!("无法读取目录 {}：{e}", folder.display()))?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let kind = entry.file_type().map_err(|e| e.to_string())?;
        if kind.is_symlink() { continue; }
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().into_owned();
        if kind.is_dir() {
            if ["图包回收站", "回收站", ".git", "node_modules"].contains(&name.as_str()) { continue; }
            let own = folder_codes(&name, re);
            walk(&path, if own.is_empty() { inherited } else { &own }, re, index)?;
        } else if kind.is_file() {
            let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
            let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
            let normalized: String = stem.chars().filter(|c| !c.is_whitespace() && !['_', '-'].contains(c)).collect();
            // Exact slot match: never use 主图10, thumbnails or unrenamed source art.
            if !["jpg", "jpeg", "png", "webp"].contains(&ext.as_str()) || !["主图1", "主图01"].contains(&normalized.as_str()) { continue; }
            for code in inherited {
                index.entry(code.clone()).or_default().push(path.to_string_lossy().into_owned());
            }
        }
    }
    Ok(())
}

fn scan(root: String, codes: Vec<String>) -> Result<Vec<MainImageRow>, String> {
    let root = PathBuf::from(root);
    if !root.is_dir() { return Err("请选择有效的产品目录".into()); }
    if codes.len() > 5000 { return Err("每次最多查找 5000 行".into()); }
    let re = Regex::new(r"(?i)^SKU[0-9]{8}$").unwrap();
    let folder_re = Regex::new(r"(?i)SKU[0-9]{8}").unwrap();
    let inherited = folder_codes(root.file_name().and_then(|s| s.to_str()).unwrap_or(""), &folder_re);
    let mut index = HashMap::new();
    walk(&root, &inherited, &folder_re, &mut index)?;
    for paths in index.values_mut() { paths.sort(); paths.dedup(); }
    Ok(codes.into_iter().map(|code| {
        let key = code.trim().to_uppercase();
        let valid = re.is_match(&key);
        let candidates = if valid { index.get(&key).cloned().unwrap_or_default() } else { vec![] };
        let status = if key.is_empty() || key == "/" { "placeholder" } else if !valid { "invalid" } else if candidates.is_empty() { "missing" } else if candidates.len() > 1 { "ambiguous" } else { "ready" }.to_string();
        let selected_path = if candidates.len() == 1 { Some(candidates[0].clone()) } else { None };
        MainImageRow { code, status, candidates, selected_path }
    }).collect())
}

#[tauri::command]
pub async fn scan_main_images(root: String, codes: Vec<String>) -> Result<Vec<MainImageRow>, String> {
    tauri::async_runtime::spawn_blocking(move || scan(root, codes)).await.map_err(|e| e.to_string())?
}

fn xml(s: &str) -> String {
    s.chars().filter(|c| *c >= ' ' || ['\n', '\r', '\t'].contains(c)).collect::<String>().replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;").replace('\'', "&apos;")
}

fn export(path: String, rows: Vec<MainImageRow>) -> Result<String, String> {
    if rows.is_empty() || rows.len() > 5000 { return Err("请先查找编码（最多 5000 行）".into()); }
    if !path.to_lowercase().ends_with(".xlsx") { return Err("输出文件必须使用 .xlsx 后缀".into()); }
    let mut zip = ZipWriter::new(Cursor::new(Vec::new()));
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
    fn add(zip: &mut ZipWriter<Cursor<Vec<u8>>>, name: &str, data: &[u8], options: SimpleFileOptions) -> Result<(), String> {
        zip.start_file(name, options).map_err(|e| e.to_string())?;
        zip.write_all(data).map_err(|e| e.to_string())
    }
    let mut sheet = String::from(r#"<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><cols><col min="1" max="1" width="22" customWidth="1"/><col min="2" max="2" width="25" customWidth="1"/><col min="3" max="3" width="28" customWidth="1"/></cols><sheetData>"#);
    let mut drawing = String::from(r#"<?xml version="1.0" encoding="UTF-8"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">"#);
    let mut rels = String::from(r#"<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">"#);
    for (i, row) in rows.iter().enumerate() {
        let n = i + 1;
        let message = match row.status.as_str() { "placeholder" => "", "invalid" => "编码格式无效", "missing" => "未找到主图1", "ambiguous" if row.selected_path.is_none() => "多张匹配图，待选择", _ => "" };
        sheet.push_str(&format!(r#"<row r="{n}" ht="126" customHeight="1"><c r="A{n}" t="inlineStr"><is><t xml:space="preserve">{}</t></is></c><c r="C{n}" t="inlineStr"><is><t>{}</t></is></c></row>"#, xml(&row.code), message));
        if let Some(source) = &row.selected_path {
            if !row.candidates.contains(source) { return Err("选择的图片不在搜索结果中，请重新查找".into()); }
            let image = image::open(source).map_err(|e| format!("无法读取图片 {source}：{e}"))?.thumbnail(160, 160);
            let (w, h) = (image.width() as u64 * 9525, image.height() as u64 * 9525);
            let mut bytes = Cursor::new(Vec::new());
            image.write_to(&mut bytes, image::ImageFormat::Png).map_err(|e| e.to_string())?;
            add(&mut zip, &format!("xl/media/image{n}.png"), &bytes.into_inner(), options)?;
            rels.push_str(&format!(r#"<Relationship Id="rId{n}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image{n}.png"/>"#));
            drawing.push_str(&format!(r#"<xdr:oneCellAnchor><xdr:from><xdr:col>1</xdr:col><xdr:colOff>38100</xdr:colOff><xdr:row>{i}</xdr:row><xdr:rowOff>38100</xdr:rowOff></xdr:from><xdr:ext cx="{w}" cy="{h}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="{n}" name="主图1 {n}"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rId{n}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{w}" cy="{h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>"#));
        }
    }
    sheet.push_str(r#"</sheetData><drawing r:id="rId1"/></worksheet>"#);
    drawing.push_str("</xdr:wsDr>"); rels.push_str("</Relationships>");
    for (name, data) in [
        ("xl/worksheets/sheet1.xml", sheet.as_str()),
        ("xl/drawings/drawing1.xml", drawing.as_str()),
        ("xl/drawings/_rels/drawing1.xml.rels", rels.as_str()),
        ("[Content_Types].xml", r#"<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>"#),
        ("_rels/.rels", r#"<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>"#),
        ("xl/workbook.xml", r#"<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="主图填表" sheetId="1" r:id="rId1"/></sheets></workbook>"#),
        ("xl/_rels/workbook.xml.rels", r#"<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>"#),
        ("xl/worksheets/_rels/sheet1.xml.rels", r#"<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>"#),
    ] { add(&mut zip, name, data.as_bytes(), options)?; }
    let bytes = zip.finish().map_err(|e| e.to_string())?.into_inner();
    // Refuse to overwrite an existing workbook.
    let mut file = fs::OpenOptions::new().write(true).create_new(true).open(&path).map_err(|e| format!("无法创建 Excel，请选择新文件名：{e}"))?;
    file.write_all(&bytes).map_err(|e| e.to_string())?;
    Ok(path)
}

#[tauri::command]
pub async fn export_main_images(path: String, rows: Vec<MainImageRow>) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || export(path, rows)).await.map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn preserves_order_placeholders_duplicates_and_ambiguity() {
        let root = std::env::temp_dir().join(format!("main-image-test-{}", uuid::Uuid::new_v4()));
        let folder = root.join("SKU00050716 产品/套图/主图");
        fs::create_dir_all(&folder).unwrap();
        image::RgbImage::new(24, 12).save(folder.join("主图1.png")).unwrap();
        fs::write(folder.join("主图10.jpg"), []).unwrap();
        let codes = vec!["SKU00050716", "/", "", "SKU00000000", "SKU00050716", "SKU000507160"];
        let rows = scan(root.to_string_lossy().into(), codes.iter().map(|s| s.to_string()).collect()).unwrap();
        assert_eq!(rows.iter().map(|r| r.code.as_str()).collect::<Vec<_>>(), codes);
        assert_eq!(rows.iter().map(|r| r.status.as_str()).collect::<Vec<_>>(), vec!["ready", "placeholder", "placeholder", "missing", "ready", "invalid"]);
        let output = root.join("result.xlsx");
        export(output.to_string_lossy().into(), rows).unwrap();
        let mut book = zip::ZipArchive::new(fs::File::open(&output).unwrap()).unwrap();
        assert!(book.by_name("xl/media/image1.png").is_ok());
        assert!(book.by_name("xl/media/image5.png").is_ok());
        assert!(book.by_name("xl/media/image2.png").is_err());
        fs::write(folder.join("主图1.jpg"), []).unwrap();
        assert_eq!(scan(root.to_string_lossy().into(), vec![codes[0].into()]).unwrap()[0].status, "ambiguous");
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn rejects_longer_folder_codes() {
        let re = Regex::new(r"(?i)SKU[0-9]{8}").unwrap();
        assert!(folder_codes("SKU000507160 产品", &re).is_empty());
        assert!(folder_codes("sku00050716_产品", &re).contains("SKU00050716"));
    }

    #[test]
    fn searches_nested_main_images_across_the_entire_selected_root() {
        let root = std::env::temp_dir().join(format!("main-image-nested-{}", uuid::Uuid::new_v4()));
        let nested = root.join("AMZ 尿素保湿足霜 SKU00046312").join("套图").join("AMZ 尿素足霜 SKU00046312").join("主图");
        let other = root.join("其他产品 SKU00050716").join("套图").join("主图");
        fs::create_dir_all(&nested).unwrap();
        fs::create_dir_all(&other).unwrap();
        fs::write(nested.join("主图1.jpg"), []).unwrap();
        fs::write(other.join("主图1.jpg"), []).unwrap();
        let rows = scan(root.to_string_lossy().into(), vec!["SKU00050716".into(), "SKU00046312".into()]).unwrap();
        assert_eq!(rows[0].selected_path.as_deref(), other.join("主图1.jpg").to_str());
        assert_eq!(rows[1].selected_path.as_deref(), nested.join("主图1.jpg").to_str());
        fs::remove_dir_all(root).unwrap();
    }
}
