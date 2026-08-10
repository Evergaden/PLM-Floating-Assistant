use std::{
    collections::{HashMap, HashSet},
    fs,
    path::{Path, PathBuf},
    time::UNIX_EPOCH,
};

use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ParameterSampleIndexItem {
    sku: String,
    product_name: String,
    transparent_path: Option<String>,
    parameter_path: Option<String>,
    status: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct NormalizedRect {
    x: f32,
    y: f32,
    width: f32,
    height: f32,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct BoxDimensionMarkAnalysis {
    kind: String,
    orientation: String,
    placement: String,
    line_bounds: NormalizedRect,
    label_bounds: Option<NormalizedRect>,
    line_gap_ratio: f32,
    label_offset_ratio: Option<f32>,
    angle_degrees: f32,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ParameterBoxSampleAnalysis {
    sku: String,
    product_name: String,
    parameter_path: String,
    status: String,
    confidence: f32,
    box_bounds: Option<NormalizedRect>,
    length_mark: Option<BoxDimensionMarkAnalysis>,
    height_mark: Option<BoxDimensionMarkAnalysis>,
    depth_mark: Option<BoxDimensionMarkAnalysis>,
    selection_method: String,
    source_box_position: String,
    target_box_position: String,
    box_match_score: Option<f32>,
    message: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct DimensionPlacementSummary {
    count: usize,
    primary_placement: String,
    placement_counts: HashMap<String, usize>,
    median_line_gap_ratio: f32,
    median_label_offset_ratio: Option<f32>,
    median_angle_degrees: f32,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ParameterBoxAnalysisResult {
    report_path: String,
    runtime_rule_path: String,
    rule_version: String,
    source_index_path: String,
    analyzed: usize,
    confident: usize,
    low_confidence: usize,
    skipped: usize,
    length_rule: DimensionPlacementSummary,
    height_rule: DimensionPlacementSummary,
    depth_rule: DimensionPlacementSummary,
    items: Vec<ParameterBoxSampleAnalysis>,
    runtime_rule: Value,
    logs: Vec<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CloudParameterRulePackage {
    manifest_url: String,
    rule_url: String,
    manifest: Value,
    rule: Value,
}

#[derive(Clone, Debug)]
struct DarkImageComponent {
    id: usize,
    pixel_count: usize,
    min_x: u32,
    min_y: u32,
    max_x: u32,
    max_y: u32,
    angle_degrees: f64,
    elongation: f64,
    density: f64,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum DimensionLineOrientation {
    Horizontal,
    Vertical,
    Diagonal,
}

#[derive(Clone, Debug)]
struct DimensionLineCandidate {
    component: DarkImageComponent,
    orientation: DimensionLineOrientation,
}

#[derive(Clone, Debug)]
struct DimensionedObjectCandidate {
    horizontal: DimensionLineCandidate,
    vertical: DimensionLineCandidate,
    bounds: (u32, u32, u32, u32),
    score: f64,
}

#[derive(Clone, Debug)]
struct TransparentObjectComponent {
    min_x: u32,
    min_y: u32,
    max_x: u32,
    max_y: u32,
    pixel_count: usize,
    fill_ratio: f64,
}

#[derive(Clone, Debug)]
struct PaperBoxSelection {
    object_index: usize,
    method: String,
    source_position: String,
    target_position: String,
    match_score: Option<f64>,
}

fn path_text(path: &Path) -> String {
    path.to_string_lossy().to_string()
}

fn normalized_rect(bounds: (u32, u32, u32, u32), width: u32, height: u32) -> NormalizedRect {
    let (min_x, min_y, max_x, max_y) = bounds;
    NormalizedRect {
        x: min_x as f32 / width.max(1) as f32,
        y: min_y as f32 / height.max(1) as f32,
        width: max_x.saturating_sub(min_x).saturating_add(1) as f32 / width.max(1) as f32,
        height: max_y.saturating_sub(min_y).saturating_add(1) as f32 / height.max(1) as f32,
    }
}

fn component_bounds(component: &DarkImageComponent) -> (u32, u32, u32, u32) {
    (
        component.min_x,
        component.min_y,
        component.max_x,
        component.max_y,
    )
}

fn dark_image_components(image: &image::RgbImage) -> Vec<DarkImageComponent> {
    let (width, height) = image.dimensions();
    let pixel_total = width as usize * height as usize;
    let mut dark = vec![0_u8; pixel_total];
    for (index, pixel) in image.pixels().enumerate() {
        dark[index] = u8::from(pixel.0.iter().copied().max().unwrap_or(255) < 96);
    }
    let mut visited = vec![0_u8; pixel_total];
    let mut stack = Vec::new();
    let mut components = Vec::new();
    for start in 0..pixel_total {
        if dark[start] == 0 || visited[start] != 0 {
            continue;
        }
        visited[start] = 1;
        stack.push(start);
        let mut pixel_count = 0_usize;
        let mut min_x = width;
        let mut min_y = height;
        let mut max_x = 0_u32;
        let mut max_y = 0_u32;
        let mut sum_x = 0_f64;
        let mut sum_y = 0_f64;
        let mut sum_xx = 0_f64;
        let mut sum_yy = 0_f64;
        let mut sum_xy = 0_f64;
        while let Some(index) = stack.pop() {
            let x = (index % width as usize) as u32;
            let y = (index / width as usize) as u32;
            pixel_count += 1;
            min_x = min_x.min(x);
            min_y = min_y.min(y);
            max_x = max_x.max(x);
            max_y = max_y.max(y);
            let xf = x as f64;
            let yf = y as f64;
            sum_x += xf;
            sum_y += yf;
            sum_xx += xf * xf;
            sum_yy += yf * yf;
            sum_xy += xf * yf;
            let start_x = x.saturating_sub(1);
            let end_x = (x + 1).min(width.saturating_sub(1));
            let start_y = y.saturating_sub(1);
            let end_y = (y + 1).min(height.saturating_sub(1));
            for neighbor_y in start_y..=end_y {
                for neighbor_x in start_x..=end_x {
                    let neighbor = neighbor_y as usize * width as usize + neighbor_x as usize;
                    if dark[neighbor] != 0 && visited[neighbor] == 0 {
                        visited[neighbor] = 1;
                        stack.push(neighbor);
                    }
                }
            }
        }
        if pixel_count < 12 {
            continue;
        }
        let count = pixel_count as f64;
        let mean_x = sum_x / count;
        let mean_y = sum_y / count;
        let covariance_xx = (sum_xx / count - mean_x * mean_x).max(0.0);
        let covariance_yy = (sum_yy / count - mean_y * mean_y).max(0.0);
        let covariance_xy = sum_xy / count - mean_x * mean_y;
        let discriminant =
            (((covariance_xx - covariance_yy) * 0.5).powi(2) + covariance_xy.powi(2)).sqrt();
        let major = ((covariance_xx + covariance_yy) * 0.5 + discriminant).max(0.0001);
        let minor = ((covariance_xx + covariance_yy) * 0.5 - discriminant).max(0.0001);
        let angle_degrees = 0.5
            * (2.0 * covariance_xy)
                .atan2(covariance_xx - covariance_yy)
                .to_degrees();
        let box_area = max_x.saturating_sub(min_x).saturating_add(1) as f64
            * max_y.saturating_sub(min_y).saturating_add(1) as f64;
        components.push(DarkImageComponent {
            id: components.len(),
            pixel_count,
            min_x,
            min_y,
            max_x,
            max_y,
            angle_degrees,
            elongation: major / minor,
            density: pixel_count as f64 / box_area.max(1.0),
        });
    }
    components
}

fn dimension_line_candidates(
    components: &[DarkImageComponent],
    width: u32,
    height: u32,
) -> Vec<DimensionLineCandidate> {
    let min_dimension = width.min(height) as f64;
    let mut output = Vec::new();
    for component in components {
        let component_width = component
            .max_x
            .saturating_sub(component.min_x)
            .saturating_add(1) as f64;
        let component_height = component
            .max_y
            .saturating_sub(component.min_y)
            .saturating_add(1) as f64;
        let angle = component.angle_degrees.abs();
        let longest_span = component_width.max(component_height);
        if component.pixel_count < 40
            || component.density > 0.36
            || component.elongation < 5.0
            || longest_span < min_dimension * 0.035
        {
            continue;
        }
        let orientation = if angle <= 15.0 && component_width >= width as f64 * 0.045 {
            DimensionLineOrientation::Horizontal
        } else if angle >= 75.0 && component_height >= height as f64 * 0.07 {
            DimensionLineOrientation::Vertical
        } else if angle > 15.0 && angle < 75.0 {
            DimensionLineOrientation::Diagonal
        } else {
            continue;
        };
        output.push(DimensionLineCandidate {
            component: component.clone(),
            orientation,
        });
    }
    output
}

fn dimensioned_object_candidates(
    lines: &[DimensionLineCandidate],
) -> Vec<DimensionedObjectCandidate> {
    let horizontal = lines
        .iter()
        .filter(|line| line.orientation == DimensionLineOrientation::Horizontal)
        .collect::<Vec<_>>();
    let vertical = lines
        .iter()
        .filter(|line| line.orientation == DimensionLineOrientation::Vertical)
        .collect::<Vec<_>>();
    let mut pairs = Vec::new();
    for horizontal_line in horizontal {
        let h = &horizontal_line.component;
        let horizontal_width = h.max_x.saturating_sub(h.min_x).saturating_add(1).max(1) as f64;
        let horizontal_y = (h.min_y + h.max_y) as f64 * 0.5;
        for vertical_line in &vertical {
            let v = &vertical_line.component;
            let vertical_height = v.max_y.saturating_sub(v.min_y).saturating_add(1).max(1) as f64;
            let vertical_x = (v.min_x + v.max_x) as f64 * 0.5;
            let horizontal_gap = if vertical_x < h.min_x as f64 {
                (h.min_x as f64 - vertical_x) / horizontal_width
            } else if vertical_x > h.max_x as f64 {
                (vertical_x - h.max_x as f64) / horizontal_width
            } else {
                continue;
            };
            let vertical_gap = if horizontal_y < v.min_y as f64 {
                (v.min_y as f64 - horizontal_y) / vertical_height
            } else if horizontal_y > v.max_y as f64 {
                (horizontal_y - v.max_y as f64) / vertical_height
            } else {
                continue;
            };
            if horizontal_gap > 0.35 || vertical_gap > 0.35 {
                continue;
            }
            pairs.push(DimensionedObjectCandidate {
                horizontal: horizontal_line.clone(),
                vertical: (*vertical_line).clone(),
                bounds: (h.min_x, v.min_y, h.max_x, v.max_y),
                score: horizontal_gap + vertical_gap,
            });
        }
    }
    pairs.sort_by(|left, right| left.score.total_cmp(&right.score));
    let mut used_horizontal = HashSet::new();
    let mut used_vertical = HashSet::new();
    let mut output = Vec::new();
    for pair in pairs {
        if used_horizontal.contains(&pair.horizontal.component.id)
            || used_vertical.contains(&pair.vertical.component.id)
        {
            continue;
        }
        used_horizontal.insert(pair.horizontal.component.id);
        used_vertical.insert(pair.vertical.component.id);
        output.push(pair);
    }
    output.sort_by_key(|item| item.bounds.0);
    output
}

fn transparent_object_components(path: &str) -> Vec<TransparentObjectComponent> {
    let Ok(image) = image::open(path).map(|image| image.to_rgba8()) else {
        return Vec::new();
    };
    let (width, height) = image.dimensions();
    let pixel_total = width as usize * height as usize;
    let mut opaque = vec![0_u8; pixel_total];
    for (index, pixel) in image.pixels().enumerate() {
        opaque[index] = u8::from(pixel.0[3] > 16);
    }
    let mut visited = vec![0_u8; pixel_total];
    let mut stack = Vec::new();
    let mut output = Vec::new();
    for start in 0..pixel_total {
        if opaque[start] == 0 || visited[start] != 0 {
            continue;
        }
        visited[start] = 1;
        stack.push(start);
        let mut pixel_count = 0_usize;
        let mut min_x = width;
        let mut min_y = height;
        let mut max_x = 0_u32;
        let mut max_y = 0_u32;
        while let Some(index) = stack.pop() {
            let x = (index % width as usize) as u32;
            let y = (index / width as usize) as u32;
            pixel_count += 1;
            min_x = min_x.min(x);
            min_y = min_y.min(y);
            max_x = max_x.max(x);
            max_y = max_y.max(y);
            let start_x = x.saturating_sub(1);
            let end_x = (x + 1).min(width.saturating_sub(1));
            let start_y = y.saturating_sub(1);
            let end_y = (y + 1).min(height.saturating_sub(1));
            for neighbor_y in start_y..=end_y {
                for neighbor_x in start_x..=end_x {
                    let neighbor = neighbor_y as usize * width as usize + neighbor_x as usize;
                    if opaque[neighbor] != 0 && visited[neighbor] == 0 {
                        visited[neighbor] = 1;
                        stack.push(neighbor);
                    }
                }
            }
        }
        let component_width = max_x.saturating_sub(min_x).saturating_add(1);
        let component_height = max_y.saturating_sub(min_y).saturating_add(1);
        let box_area = component_width as usize * component_height as usize;
        if pixel_count < pixel_total / 400
            || component_width < width / 30
            || component_height < height / 30
        {
            continue;
        }
        output.push(TransparentObjectComponent {
            min_x,
            min_y,
            max_x,
            max_y,
            pixel_count,
            fill_ratio: pixel_count as f64 / box_area.max(1) as f64,
        });
    }
    output.sort_by_key(|component| component.min_x);
    output
}

fn ordered_position(index: usize, count: usize) -> String {
    if count <= 1 {
        "single".to_string()
    } else if index == 0 {
        "left".to_string()
    } else if index + 1 == count {
        "right".to_string()
    } else {
        "middle".to_string()
    }
}

fn select_paper_box(
    objects: &[DimensionedObjectCandidate],
    transparent_path: Option<&str>,
) -> PaperBoxSelection {
    if objects.len() <= 1 {
        return PaperBoxSelection {
            object_index: 0,
            method: "single-dimensioned-object".to_string(),
            source_position: String::new(),
            target_position: "single".to_string(),
            match_score: None,
        };
    }
    let components = transparent_path
        .map(transparent_object_components)
        .unwrap_or_default();
    if components.len() >= 2 {
        let source_box_index = components
            .iter()
            .enumerate()
            .max_by(|left, right| {
                left.1
                    .fill_ratio
                    .total_cmp(&right.1.fill_ratio)
                    .then_with(|| left.1.pixel_count.cmp(&right.1.pixel_count))
            })
            .map(|(index, _)| index)
            .unwrap_or(0);
        let source_box = &components[source_box_index];
        let source_width = source_box
            .max_x
            .saturating_sub(source_box.min_x)
            .saturating_add(1)
            .max(1) as f64;
        let source_height = source_box
            .max_y
            .saturating_sub(source_box.min_y)
            .saturating_add(1)
            .max(1) as f64;
        let source_aspect = source_width / source_height;
        let source_rank =
            source_box_index as f64 / components.len().saturating_sub(1).max(1) as f64;
        let mut matches = objects
            .iter()
            .enumerate()
            .map(|(index, object)| {
                let target_width = object
                    .bounds
                    .2
                    .saturating_sub(object.bounds.0)
                    .saturating_add(1)
                    .max(1) as f64;
                let target_height = object
                    .bounds
                    .3
                    .saturating_sub(object.bounds.1)
                    .saturating_add(1)
                    .max(1) as f64;
                let target_aspect = target_width / target_height;
                let target_rank = index as f64 / objects.len().saturating_sub(1).max(1) as f64;
                let aspect_penalty = (target_aspect / source_aspect.max(0.0001)).ln().abs() * 0.72;
                let order_penalty = (target_rank - source_rank).abs() * 0.58;
                (aspect_penalty + order_penalty, index)
            })
            .collect::<Vec<_>>();
        matches.sort_by(|left, right| left.0.total_cmp(&right.0));
        let (score, object_index) = matches[0];
        return PaperBoxSelection {
            object_index,
            method: "transparent-component-match".to_string(),
            source_position: ordered_position(source_box_index, components.len()),
            target_position: ordered_position(object_index, objects.len()),
            match_score: Some(score),
        };
    }
    PaperBoxSelection {
        object_index: 0,
        method: "leftmost-fallback".to_string(),
        source_position: String::new(),
        target_position: "left".to_string(),
        match_score: None,
    }
}

fn union_label_components(
    components: &[DarkImageComponent],
    excluded_id: usize,
    region: (u32, u32, u32, u32),
    width: u32,
    height: u32,
) -> Option<(u32, u32, u32, u32)> {
    let mut matches = components.iter().filter(|component| {
        if component.id == excluded_id || component.pixel_count < 8 {
            return false;
        }
        let component_width = component
            .max_x
            .saturating_sub(component.min_x)
            .saturating_add(1);
        let component_height = component
            .max_y
            .saturating_sub(component.min_y)
            .saturating_add(1);
        if component_width > width / 4 || component_height > height / 4 {
            return false;
        }
        let center_x = (component.min_x + component.max_x) / 2;
        let center_y = (component.min_y + component.max_y) / 2;
        center_x >= region.0 && center_x <= region.2 && center_y >= region.1 && center_y <= region.3
    });
    let first = matches.next()?;
    let mut bounds = (first.min_x, first.min_y, first.max_x, first.max_y);
    for component in matches {
        bounds.0 = bounds.0.min(component.min_x);
        bounds.1 = bounds.1.min(component.min_y);
        bounds.2 = bounds.2.max(component.max_x);
        bounds.3 = bounds.3.max(component.max_y);
    }
    Some(bounds)
}

fn axis_mark_analysis(
    kind: &str,
    line: &DimensionLineCandidate,
    box_bounds: (u32, u32, u32, u32),
    components: &[DarkImageComponent],
    width: u32,
    height: u32,
) -> BoxDimensionMarkAnalysis {
    let component = &line.component;
    let box_width = box_bounds
        .2
        .saturating_sub(box_bounds.0)
        .saturating_add(1)
        .max(1) as f32;
    let box_height = box_bounds
        .3
        .saturating_sub(box_bounds.1)
        .saturating_add(1)
        .max(1) as f32;
    let (placement, gap, label_region, label_offset_scale) =
        if line.orientation == DimensionLineOrientation::Horizontal {
            let line_y = (component.min_y + component.max_y) / 2;
            let margin_y = (height as f32 * 0.14).round() as u32;
            let margin_x = (box_width * 0.18).round() as u32;
            if line_y < box_bounds.1 {
                (
                    "top",
                    box_bounds.1.saturating_sub(component.max_y) as f32 / box_height,
                    (
                        component.min_x.saturating_sub(margin_x),
                        component.min_y.saturating_sub(margin_y),
                        (component.max_x + margin_x).min(width.saturating_sub(1)),
                        component.min_y,
                    ),
                    box_height,
                )
            } else {
                (
                    "bottom",
                    component.min_y.saturating_sub(box_bounds.3) as f32 / box_height,
                    (
                        component.min_x.saturating_sub(margin_x),
                        component.max_y,
                        (component.max_x + margin_x).min(width.saturating_sub(1)),
                        (component.max_y + margin_y).min(height.saturating_sub(1)),
                    ),
                    box_height,
                )
            }
        } else {
            let line_x = (component.min_x + component.max_x) / 2;
            let margin_x = (width as f32 * 0.14).round() as u32;
            let margin_y = (box_height * 0.15).round() as u32;
            if line_x < box_bounds.0 {
                (
                    "left",
                    box_bounds.0.saturating_sub(component.max_x) as f32 / box_width,
                    (
                        component.min_x.saturating_sub(margin_x),
                        component.min_y.saturating_sub(margin_y),
                        component.min_x,
                        (component.max_y + margin_y).min(height.saturating_sub(1)),
                    ),
                    box_width,
                )
            } else {
                (
                    "right",
                    component.min_x.saturating_sub(box_bounds.2) as f32 / box_width,
                    (
                        component.max_x,
                        component.min_y.saturating_sub(margin_y),
                        (component.max_x + margin_x).min(width.saturating_sub(1)),
                        (component.max_y + margin_y).min(height.saturating_sub(1)),
                    ),
                    box_width,
                )
            }
        };
    let label_bounds =
        union_label_components(components, component.id, label_region, width, height);
    let label_offset = label_bounds.map(|bounds| {
        (if line.orientation == DimensionLineOrientation::Horizontal {
            if placement == "top" {
                component.min_y.saturating_sub(bounds.3)
            } else {
                bounds.1.saturating_sub(component.max_y)
            }
        } else if placement == "left" {
            component.min_x.saturating_sub(bounds.2)
        } else {
            bounds.0.saturating_sub(component.max_x)
        }) as f32
            / label_offset_scale.max(1.0)
    });
    BoxDimensionMarkAnalysis {
        kind: kind.to_string(),
        orientation: if line.orientation == DimensionLineOrientation::Horizontal {
            "horizontal"
        } else {
            "vertical"
        }
        .to_string(),
        placement: placement.to_string(),
        line_bounds: normalized_rect(component_bounds(component), width, height),
        label_bounds: label_bounds.map(|bounds| normalized_rect(bounds, width, height)),
        line_gap_ratio: gap,
        label_offset_ratio: label_offset,
        angle_degrees: component.angle_degrees as f32,
    }
}

fn depth_mark_analysis(
    lines: &[DimensionLineCandidate],
    box_bounds: (u32, u32, u32, u32),
    components: &[DarkImageComponent],
    width: u32,
    height: u32,
) -> Option<BoxDimensionMarkAnalysis> {
    let box_width = box_bounds
        .2
        .saturating_sub(box_bounds.0)
        .saturating_add(1)
        .max(1) as f64;
    let box_height = box_bounds
        .3
        .saturating_sub(box_bounds.1)
        .saturating_add(1)
        .max(1) as f64;
    let box_center_x = (box_bounds.0 + box_bounds.2) as f64 * 0.5;
    let mut candidates = lines
        .iter()
        .filter(|line| line.orientation == DimensionLineOrientation::Diagonal)
        .filter_map(|line| {
            let component = &line.component;
            let center_x = (component.min_x + component.max_x) as f64 * 0.5;
            let center_y = (component.min_y + component.max_y) as f64 * 0.5;
            if center_y > box_bounds.1 as f64 + box_height * 0.18
                || center_x < box_bounds.0 as f64 - box_width * 0.45
                || center_x > box_bounds.2 as f64 + box_width * 0.45
            {
                return None;
            }
            let top_gap = if component.max_y < box_bounds.1 {
                (box_bounds.1 - component.max_y) as f64 / box_height
            } else {
                0.0
            };
            let horizontal_gap = if center_x < box_bounds.0 as f64 {
                (box_bounds.0 as f64 - center_x) / box_width
            } else if center_x > box_bounds.2 as f64 {
                (center_x - box_bounds.2 as f64) / box_width
            } else {
                0.0
            };
            Some((top_gap + horizontal_gap, line))
        })
        .collect::<Vec<_>>();
    candidates.sort_by(|left, right| left.0.total_cmp(&right.0));
    let (_, line) = candidates.first()?;
    let component = &line.component;
    let placement = if (component.min_x + component.max_x) as f64 * 0.5 <= box_center_x {
        "top-left"
    } else {
        "top-right"
    };
    let margin_x = (box_width * 0.25).round() as u32;
    let margin_y = (height as f64 * 0.12).round() as u32;
    let label_region = (
        component.min_x.saturating_sub(margin_x),
        component.min_y.saturating_sub(margin_y),
        (component.max_x + margin_x).min(width.saturating_sub(1)),
        component.min_y,
    );
    let label_bounds =
        union_label_components(components, component.id, label_region, width, height);
    let label_offset = label_bounds
        .map(|bounds| component.min_y.saturating_sub(bounds.3) as f32 / box_height.max(1.0) as f32);
    Some(BoxDimensionMarkAnalysis {
        kind: "boxDepth".to_string(),
        orientation: "diagonal".to_string(),
        placement: placement.to_string(),
        line_bounds: normalized_rect(component_bounds(component), width, height),
        label_bounds: label_bounds.map(|bounds| normalized_rect(bounds, width, height)),
        line_gap_ratio: box_bounds.1.saturating_sub(component.max_y) as f32
            / box_height.max(1.0) as f32,
        label_offset_ratio: label_offset,
        angle_degrees: component.angle_degrees as f32,
    })
}

fn analyze_parameter_box_sample(sample: &ParameterSampleIndexItem) -> ParameterBoxSampleAnalysis {
    let parameter_path = sample.parameter_path.clone().unwrap_or_default();
    let mut output = ParameterBoxSampleAnalysis {
        sku: sample.sku.clone(),
        product_name: sample.product_name.clone(),
        parameter_path: parameter_path.clone(),
        status: "skipped".to_string(),
        confidence: 0.0,
        box_bounds: None,
        length_mark: None,
        height_mark: None,
        depth_mark: None,
        selection_method: String::new(),
        source_box_position: String::new(),
        target_box_position: String::new(),
        box_match_score: None,
        message: String::new(),
    };
    if parameter_path.is_empty() {
        output.message = "没有正确尺寸图".to_string();
        return output;
    }
    let image = match image::open(&parameter_path) {
        Ok(image) => image.to_rgb8(),
        Err(error) => {
            output.message = format!("无法读取尺寸图：{error}");
            return output;
        }
    };
    let (width, height) = image.dimensions();
    let components = dark_image_components(&image);
    let lines = dimension_line_candidates(&components, width, height);
    let objects = dimensioned_object_candidates(&lines);
    if objects.is_empty() {
        output.status = "low-confidence".to_string();
        output.message = "没有找到可配对的纸盒横向、纵向尺寸线".to_string();
        return output;
    }
    let selection = select_paper_box(&objects, sample.transparent_path.as_deref());
    let paper_box = &objects[selection.object_index];
    let length_mark = axis_mark_analysis(
        "boxLength",
        &paper_box.horizontal,
        paper_box.bounds,
        &components,
        width,
        height,
    );
    let height_mark = axis_mark_analysis(
        "boxHeight",
        &paper_box.vertical,
        paper_box.bounds,
        &components,
        width,
        height,
    );
    let depth_mark = depth_mark_analysis(&lines, paper_box.bounds, &components, width, height);
    let mut confidence = (0.92 - paper_box.score * 0.45).clamp(0.45, 0.94);
    if objects.len() == 1 {
        confidence -= 0.08;
    }
    if let Some(score) = selection.match_score {
        confidence += (0.08 - score * 0.08).clamp(-0.10, 0.08);
    } else if objects.len() > 1 {
        confidence -= 0.08;
    }
    if length_mark.label_bounds.is_none() {
        confidence -= 0.05;
    }
    if height_mark.label_bounds.is_none() {
        confidence -= 0.05;
    }
    confidence = confidence.clamp(0.0, 1.0);
    output.status = if confidence >= 0.68 {
        "confident"
    } else {
        "low-confidence"
    }
    .to_string();
    output.confidence = confidence as f32;
    output.box_bounds = Some(normalized_rect(paper_box.bounds, width, height));
    output.length_mark = Some(length_mark);
    output.height_mark = Some(height_mark);
    output.depth_mark = depth_mark;
    output.selection_method = selection.method.clone();
    output.source_box_position = selection.source_position.clone();
    output.target_box_position = selection.target_position.clone();
    output.box_match_score = selection.match_score.map(|score| score as f32);
    output.message = if selection.method == "transparent-component-match" {
        format!(
            "识别到 {} 组带尺寸对象；透明图纸盒在{}，参数图匹配到{}对象",
            objects.len(),
            selection.source_position,
            selection.target_position
        )
    } else if objects.len() > 1 {
        format!(
            "识别到 {} 组带尺寸对象，透明图无法拆分，暂用左侧纸盒候选",
            objects.len()
        )
    } else {
        "仅识别到 1 组带尺寸对象，请抽样核对是否为纸盒".to_string()
    };
    output
}

fn median(mut values: Vec<f32>) -> f32 {
    if values.is_empty() {
        return 0.0;
    }
    values.sort_by(|left, right| left.total_cmp(right));
    let middle = values.len() / 2;
    if values.len() % 2 == 0 {
        (values[middle - 1] + values[middle]) * 0.5
    } else {
        values[middle]
    }
}

fn summarize_dimension_marks<'a>(
    marks: impl Iterator<Item = &'a BoxDimensionMarkAnalysis>,
) -> DimensionPlacementSummary {
    let marks = marks.collect::<Vec<_>>();
    let mut placement_counts = HashMap::new();
    for mark in &marks {
        *placement_counts.entry(mark.placement.clone()).or_insert(0) += 1;
    }
    let primary_placement = placement_counts
        .iter()
        .max_by(|left, right| left.1.cmp(right.1).then_with(|| right.0.cmp(left.0)))
        .map(|(placement, _)| placement.clone())
        .unwrap_or_default();
    DimensionPlacementSummary {
        count: marks.len(),
        primary_placement,
        placement_counts,
        median_line_gap_ratio: median(marks.iter().map(|mark| mark.line_gap_ratio).collect()),
        median_label_offset_ratio: {
            let values = marks
                .iter()
                .filter_map(|mark| mark.label_offset_ratio)
                .collect::<Vec<_>>();
            if values.is_empty() {
                None
            } else {
                Some(median(values))
            }
        },
        median_angle_degrees: median(marks.iter().map(|mark| mark.angle_degrees.abs()).collect()),
    }
}

fn runtime_profile(id: &str, label: &str, items: &[&ParameterBoxSampleAnalysis]) -> Value {
    let length_rule =
        summarize_dimension_marks(items.iter().filter_map(|item| item.length_mark.as_ref()));
    let height_rule =
        summarize_dimension_marks(items.iter().filter_map(|item| item.height_mark.as_ref()));
    let depth_rule =
        summarize_dimension_marks(items.iter().filter_map(|item| item.depth_mark.as_ref()));
    json!({
        "id": id,
        "label": label,
        "sampleCount": items.len(),
        "match": { "perspectiveDepth": id == "perspective-box" },
        "length": length_rule,
        "height": height_rule,
        "depth": depth_rule,
    })
}

fn analyze_parameter_box_annotations_plan(
    root: &Path,
) -> Result<ParameterBoxAnalysisResult, String> {
    if !root.is_dir() {
        return Err(format!("工作目录不存在：{}", path_text(root)));
    }
    let source_index_path = root.join("参数图学习样本索引.json");
    if !source_index_path.is_file() {
        return Err("尚未找到“参数图学习样本索引.json”，请先扫描并整理样本".to_string());
    }
    let index_bytes =
        fs::read(&source_index_path).map_err(|error| format!("无法读取样本索引：{error}"))?;
    let index_value: Value = serde_json::from_slice(&index_bytes)
        .map_err(|error| format!("样本索引格式错误：{error}"))?;
    let samples: Vec<ParameterSampleIndexItem> = serde_json::from_value(
        index_value
            .get("samples")
            .cloned()
            .unwrap_or(Value::Array(Vec::new())),
    )
    .map_err(|error| format!("无法读取索引样本：{error}"))?;
    let eligible = samples
        .iter()
        .filter(|sample| sample.status == "ready")
        .collect::<Vec<_>>();
    if eligible.is_empty() {
        return Err("索引中没有可分析的完整样本".to_string());
    }
    let mut items = eligible
        .into_iter()
        .map(analyze_parameter_box_sample)
        .collect::<Vec<_>>();
    items.sort_by(|left, right| {
        left.sku
            .cmp(&right.sku)
            .then_with(|| left.product_name.cmp(&right.product_name))
    });
    let analyzed = items
        .iter()
        .filter(|item| item.box_bounds.is_some())
        .count();
    let confident = items
        .iter()
        .filter(|item| item.status == "confident")
        .count();
    let low_confidence = items
        .iter()
        .filter(|item| item.status == "low-confidence")
        .count();
    let skipped = items.iter().filter(|item| item.status == "skipped").count();
    let length_rule =
        summarize_dimension_marks(items.iter().filter_map(|item| item.length_mark.as_ref()));
    let height_rule =
        summarize_dimension_marks(items.iter().filter_map(|item| item.height_mark.as_ref()));
    let depth_rule =
        summarize_dimension_marks(items.iter().filter_map(|item| item.depth_mark.as_ref()));
    let report_path = root.join("参数图纸盒标注规则.json");
    let runtime_rule_path = root.join("参数图纸盒运行规则.json");
    let generated_at_ms = std::time::SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|value| value.as_millis())
        .unwrap_or_default();
    let rule_version = format!("local-{generated_at_ms}");
    let confident_items = items
        .iter()
        .filter(|item| item.status == "confident")
        .collect::<Vec<_>>();
    let flat_items = confident_items
        .iter()
        .copied()
        .filter(|item| item.depth_mark.is_none())
        .collect::<Vec<_>>();
    let perspective_items = confident_items
        .iter()
        .copied()
        .filter(|item| item.depth_mark.is_some())
        .collect::<Vec<_>>();
    let runtime_rule = json!({
        "schemaVersion": 1,
        "ruleVersion": &rule_version,
        "minAppVersion": "0.1.16",
        "generatedAtMs": generated_at_ms,
        "coordinateMode": "normalized-relative-to-paper-box",
        "selection": {
            "primary": "transparent-component-match",
            "fallback": "single-dimensioned-object-or-leftmost",
            "supportsBoxOnEitherSide": true,
        },
        "profiles": [
            runtime_profile("flat-box", "正面纸盒", &flat_items),
            runtime_profile("perspective-box", "立体纸盒", &perspective_items),
        ],
        "confidence": { "minimum": 0.68, "manualReviewBelow": 0.76 },
    });
    let runtime_bytes = serde_json::to_vec_pretty(&runtime_rule)
        .map_err(|error| format!("无法生成运行时规则包：{error}"))?;
    fs::write(&runtime_rule_path, runtime_bytes).map_err(|error| {
        format!(
            "无法保存运行时规则包 {}：{error}",
            path_text(&runtime_rule_path)
        )
    })?;
    let mut selection_methods = HashMap::new();
    let mut source_box_positions = HashMap::new();
    for item in &items {
        if !item.selection_method.is_empty() {
            *selection_methods
                .entry(item.selection_method.clone())
                .or_insert(0_usize) += 1;
        }
        if !item.source_box_position.is_empty() {
            *source_box_positions
                .entry(item.source_box_position.clone())
                .or_insert(0_usize) += 1;
        }
    }
    let report = json!({
        "schemaVersion": 2, "generatedAtMs": generated_at_ms, "sourceIndexPath": path_text(&source_index_path), "runtimeRulePath": path_text(&runtime_rule_path),
        "analysis": "cpu-dark-line-and-transparent-component-match", "coordinateMode": "normalized-relative-to-paper-box", "paperBoxSelection": "transparent-component-match-with-fallback",
        "summary": { "eligible": items.len(), "analyzed": analyzed, "confident": confident, "lowConfidence": low_confidence, "skipped": skipped,
            "lengthRule": &length_rule, "heightRule": &height_rule, "depthRule": &depth_rule,
            "selectionMethods": selection_methods, "sourceBoxPositions": source_box_positions },
        "samples": &items,
    });
    let bytes = serde_json::to_vec_pretty(&report)
        .map_err(|error| format!("无法生成纸盒标注规则：{error}"))?;
    fs::write(&report_path, bytes)
        .map_err(|error| format!("无法保存纸盒标注规则 {}：{error}", path_text(&report_path)))?;
    let logs = vec![
        format!("读取完整样本 {} 组，仅使用本地 CPU 分析", items.len()),
        format!(
            "识别纸盒 {} 组；高置信度 {} 组；低置信度 {} 组；跳过 {} 组",
            analyzed, confident, low_confidence, skipped
        ),
        format!(
            "纸盒正面横向标注：{} 组，主要位于 {}",
            length_rule.count,
            if length_rule.primary_placement.is_empty() {
                "未识别"
            } else {
                &length_rule.primary_placement
            }
        ),
        format!(
            "纸盒高度标注：{} 组，主要位于 {}",
            height_rule.count,
            if height_rule.primary_placement.is_empty() {
                "未识别"
            } else {
                &height_rule.primary_placement
            }
        ),
        format!(
            "纸盒深度斜向标注：{} 组，主要位于 {}",
            depth_rule.count,
            if depth_rule.primary_placement.is_empty() {
                "未识别"
            } else {
                &depth_rule.primary_placement
            }
        ),
        format!("规则报告已保存：{}", path_text(&report_path)),
        format!("运行时规则包已保存：{}", path_text(&runtime_rule_path)),
    ];
    Ok(ParameterBoxAnalysisResult {
        report_path: path_text(&report_path),
        runtime_rule_path: path_text(&runtime_rule_path),
        rule_version,
        source_index_path: path_text(&source_index_path),
        analyzed,
        confident,
        low_confidence,
        skipped,
        length_rule,
        height_rule,
        depth_rule,
        items,
        runtime_rule,
        logs,
    })
}

#[tauri::command]
pub(crate) async fn analyze_parameter_box_annotations(
    root: String,
) -> Result<ParameterBoxAnalysisResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        analyze_parameter_box_annotations_plan(&PathBuf::from(root))
    })
    .await
    .map_err(|error| format!("纸盒标注分析任务异常：{error}"))?
}

#[tauri::command]
pub(crate) async fn fetch_parameter_rule_package(
    manifest_url: String,
) -> Result<CloudParameterRulePackage, String> {
    let parsed_manifest_url = reqwest::Url::parse(manifest_url.trim())
        .map_err(|error| format!("规则清单地址无效：{error}"))?;
    if parsed_manifest_url.scheme() != "https" {
        return Err("云端规则清单必须使用 HTTPS".to_string());
    }
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .build()
        .map_err(|error| format!("无法初始化规则下载器：{error}"))?;
    let manifest_response = client
        .get(parsed_manifest_url.clone())
        .send()
        .await
        .map_err(|error| format!("规则清单请求失败：{error}"))?;
    if !manifest_response.status().is_success() {
        return Err(format!(
            "规则清单请求失败：HTTP {}",
            manifest_response.status()
        ));
    }
    let manifest_bytes = manifest_response
        .bytes()
        .await
        .map_err(|error| format!("无法读取规则清单：{error}"))?;
    if manifest_bytes.len() > 512 * 1024 {
        return Err("规则清单文件过大".to_string());
    }
    let manifest: Value = serde_json::from_slice(&manifest_bytes)
        .map_err(|error| format!("规则清单不是有效 JSON：{error}"))?;
    let relative_rule_url = manifest
        .get("ruleUrl")
        .and_then(Value::as_str)
        .ok_or_else(|| "规则清单缺少 ruleUrl".to_string())?;
    let parsed_rule_url = parsed_manifest_url
        .join(relative_rule_url)
        .map_err(|error| format!("规则包地址无效：{error}"))?;
    if parsed_rule_url.scheme() != "https" {
        return Err("云端规则包必须使用 HTTPS".to_string());
    }
    let rule_response = client
        .get(parsed_rule_url.clone())
        .send()
        .await
        .map_err(|error| format!("规则包请求失败：{error}"))?;
    if !rule_response.status().is_success() {
        return Err(format!("规则包请求失败：HTTP {}", rule_response.status()));
    }
    let rule_bytes = rule_response
        .bytes()
        .await
        .map_err(|error| format!("无法读取规则包：{error}"))?;
    if rule_bytes.len() > 2 * 1024 * 1024 {
        return Err("规则包文件过大".to_string());
    }
    let rule: Value = serde_json::from_slice(&rule_bytes)
        .map_err(|error| format!("规则包不是有效 JSON：{error}"))?;
    Ok(CloudParameterRulePackage {
        manifest_url: parsed_manifest_url.to_string(),
        rule_url: parsed_rule_url.to_string(),
        manifest,
        rule,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    #[test]
    fn detects_paper_box_length_height_and_depth_brackets() {
        let root = std::env::temp_dir().join(format!("plm-box-dimension-test-{}", Uuid::new_v4()));
        fs::create_dir_all(&root).unwrap();
        let image_path = root.join("尺寸.png");
        let mut image = image::RgbImage::from_pixel(500, 500, image::Rgb([255, 255, 255]));
        for y in 100..=330 {
            for x in 100..=240 {
                image.put_pixel(x, y, image::Rgb([180, 180, 180]));
            }
        }
        let black = image::Rgb([0, 0, 0]);
        for x in 100..=240 {
            image.put_pixel(x, 360, black);
        }
        for y in 350..=370 {
            image.put_pixel(100, y, black);
            image.put_pixel(240, y, black);
        }
        for y in 100..=330 {
            image.put_pixel(70, y, black);
        }
        for x in 60..=80 {
            image.put_pixel(x, 100, black);
            image.put_pixel(x, 330, black);
        }
        for step in 0..=60 {
            image.put_pixel(110 + step, 80_u32.saturating_sub(step / 3), black);
        }
        image.save(&image_path).unwrap();
        let sample = ParameterSampleIndexItem {
            sku: "SKU00000001".to_string(),
            product_name: "测试纸盒".to_string(),
            transparent_path: None,
            parameter_path: Some(path_text(&image_path)),
            status: "ready".to_string(),
        };
        let result = analyze_parameter_box_sample(&sample);
        assert!(result.box_bounds.is_some());
        assert_eq!(result.length_mark.as_ref().unwrap().placement, "bottom");
        assert_eq!(result.height_mark.as_ref().unwrap().placement, "left");
        assert_eq!(result.depth_mark.as_ref().unwrap().placement, "top-left");
        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn matches_paper_box_on_the_right_from_transparent_components() {
        let root = std::env::temp_dir().join(format!("plm-right-box-test-{}", Uuid::new_v4()));
        fs::create_dir_all(&root).unwrap();
        let image_path = root.join("尺寸.png");
        let transparent_path = root.join("透明.png");
        let mut target = image::RgbImage::from_pixel(500, 500, image::Rgb([255, 255, 255]));
        let gray = image::Rgb([180, 180, 180]);
        let black = image::Rgb([0, 0, 0]);
        for y in 100..=300 {
            for x in 60..=140 {
                target.put_pixel(x, y, gray);
            }
        }
        for y in 100..=300 {
            for x in 280..=420 {
                target.put_pixel(x, y, gray);
            }
        }
        for x in 60..=140 {
            target.put_pixel(x, 330, black);
        }
        for y in 320..=340 {
            target.put_pixel(60, y, black);
            target.put_pixel(140, y, black);
        }
        for y in 100..=300 {
            target.put_pixel(35, y, black);
        }
        for x in 25..=45 {
            target.put_pixel(x, 100, black);
            target.put_pixel(x, 300, black);
        }
        for x in 280..=420 {
            target.put_pixel(x, 330, black);
        }
        for y in 320..=340 {
            target.put_pixel(280, y, black);
            target.put_pixel(420, y, black);
        }
        for y in 100..=300 {
            target.put_pixel(445, y, black);
        }
        for x in 435..=455 {
            target.put_pixel(x, 100, black);
            target.put_pixel(x, 300, black);
        }
        target.save(&image_path).unwrap();

        let mut transparent = image::RgbaImage::from_pixel(500, 500, image::Rgba([0, 0, 0, 0]));
        for y in 90..=310 {
            for x in 55..=145 {
                let dx = (x as f64 - 100.0) / 45.0;
                let dy = (y as f64 - 200.0) / 110.0;
                if dx * dx + dy * dy <= 1.0 {
                    transparent.put_pixel(x, y, image::Rgba([180, 180, 180, 255]));
                }
            }
        }
        for y in 90..=310 {
            for x in 275..=425 {
                transparent.put_pixel(x, y, image::Rgba([180, 180, 180, 255]));
            }
        }
        transparent.save(&transparent_path).unwrap();

        let sample = ParameterSampleIndexItem {
            sku: "SKU00000002".to_string(),
            product_name: "右侧纸盒测试".to_string(),
            transparent_path: Some(path_text(&transparent_path)),
            parameter_path: Some(path_text(&image_path)),
            status: "ready".to_string(),
        };
        let result = analyze_parameter_box_sample(&sample);
        assert_eq!(result.selection_method, "transparent-component-match");
        assert_eq!(result.source_box_position, "right");
        assert_eq!(result.target_box_position, "right");
        assert!(result.box_bounds.as_ref().unwrap().x > 0.5);
        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn analyzes_configured_parameter_sample_root() {
        let Ok(root) = std::env::var("PLM_PARAMETER_SAMPLE_ROOT") else {
            return;
        };
        let result = analyze_parameter_box_annotations_plan(Path::new(&root)).unwrap();
        println!(
            "paper box analysis: analyzed={}, confident={}, low={}, skipped={}, depth={}",
            result.analyzed,
            result.confident,
            result.low_confidence,
            result.skipped,
            result.depth_rule.count
        );
        assert!(result.analyzed > 0);
        assert!(Path::new(&result.report_path).is_file());
    }
}
