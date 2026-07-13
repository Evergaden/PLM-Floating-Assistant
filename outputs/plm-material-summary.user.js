// ==UserScript==
// @name         PLM悬浮助手
// @namespace    https://plm.westmonth.com/
// @version      2.5.32
// @description  Store PLM project packaging specs locally and show them in a floating helper.
// @author       Violet
// @match        https://plm.westmonth.com/*
// @match        https://auth.westmonth.com/*
// @require      https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js
// @require      https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      oss-pro.plm.westmonth.cn
// @connect      ai-obj.westmonth.com
// @connect      plm.westmonth.com
// @connect      velvet.qzz.io
// @connect      plm-cloud-backup.wt196731.workers.dev
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const PANEL_ID = 'plm-floating-helper';
  const LAUNCHER_ID = 'plm-floating-helper-launcher';
  const SCRIPT_VERSION = '2.5.32';
  const STORAGE_PREFIX = 'plm-floating-helper:data:';
  const STORAGE_INDEX_KEY = 'plm-floating-helper:index';
  const POSITION_KEY = 'plm-floating-helper:position';
  const LAUNCHER_POSITION_KEY = 'plm-floating-helper:launcher-position';
  const SPLIT_KEY = 'plm-floating-helper:split-width';
  const SIZE_KEY = 'plm-floating-helper:size';
  const INITIAL_LAYOUT = Object.freeze({
    panelLeftRatio: 67 / 1920,
    panelTopRatio: 129 / 1080,
    launcherLeftRatio: 674 / 1920,
    launcherTopRatio: 940 / 1080,
    splitWidth: 237,
  });
  const SETTINGS_KEY = 'plm-floating-helper:settings';
  const TUTORIAL_SEEN_KEY = 'plm-floating-helper:tutorial-seen';
  const UPLOAD_QUEUE_KEY = 'plm-floating-helper:upload-queue';
  const UPLOAD_HISTORY_KEY = 'plm-floating-helper:upload-history';
  const UPLOAD_WORKER_KEY = 'plm-floating-helper:upload-worker-running';
  const TOY_LABEL_EXPORT_MANIFEST_KEY = 'plm-floating-helper:toy-label-export-manifest';
  const LOG_KEY = 'plm-floating-helper:logs';
  const INSIGHTS_KEY = 'plm-floating-helper:insights';
  const DAILY_LEDGER_KEY = 'plm-floating-helper:daily-ledger';
  const UPLOAD_DB_NAME = 'plm-floating-helper-files';
  const UPLOAD_DB_STORE = 'files';
  const UPLOAD_MAX_ZIP_BYTES = 100 * 1024 * 1024;
  const CLOUD_BACKUP_API_BASE = 'https://velvet.qzz.io';
  const CLOUD_BACKUP_API_KEY = '53xFiTF3SY4hAcuJZyIz/JR3C2fTQrZrnS96ruV2jXA=';
  const CLOUD_BACKUP_DEBOUNCE_MS = 8000;
  const PRODUCT_REPLACE_UPLOAD_LABELS = ['\u4e3b\u56fe', '\u82f1\u6587\u53c2\u6570\u56fe', '\u8be6\u60c5\u56fe', 'SKU\u56fe', '\u89c6\u9891', '\u52a8\u56fe', '\u63a8\u54c1\u8d44\u6599', '\u56fe\u5305\u7d20\u6750'];
  const PRODUCT_BATCH_IMAGE_LABELS = ['\u4e3b\u56fe', '\u82f1\u6587\u53c2\u6570\u56fe', '\u8be6\u60c5\u56fe', 'SKU\u56fe'];
  const DETAIL_IMAGE_DOWNLOAD_CLASS = 'pfh-detail-image-download';
  const BRAND_COMPLIANCE_DATA = [{"brand":"WEST MONTH","distributed_by":"Shantou West Month Supply Chain Management","address":"Room 1001, West Tower, Huarun Building, No.\n95 Changping Road, Longhu District, Shantou\nCity \uff0c515000","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"MONARCH CHEMICALS LIMITED","address":"Building 990, Cornforth Drive, Kent Science\nPark, Sittingbourne, ME9 8PX, United Kingdom","contact":"MONARCH CHEMICALS LIMITED","phone":"+44 1795 583333","postal_code":"ME9 8PX"},"us_rep":{"company":"UA INTERNATIONAL INC.","address":"5030 Boardwalk Dr, Suite 818 Colorado Springs, CO 80919, United States","contact":"Jessica Zhong","phone":"001-719-6787182","postal_code":"80919"}},{"brand":"VIARELINE","distributed_by":"HONGKONG VIARELINE COSMETICS CO.,\nLIMITED","address":"SHOP 185 G/F, HANG WAI IND.CENTRE, NO.6\nKIN TAI ST., TUEN MUN HK","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"EELHOE PERFECT DAILY LTD","address":"FLAT 46 EAGLE WORK 58 QUAKER STREET,LO\nNDON,ENGLAND E1 6SX","contact":"Zhang Jiaming","phone":"447472085998","postal_code":"E1 6SX"},"us_rep":{"company":"VIARELINE SKINCARE LLC","address":"30 N Gould St #23619, Sheridan, WY 82801","contact":"Zhang Nana","phone":"+1 7025455912","postal_code":"82801"}},{"brand":"WOODSLEEP","distributed_by":"Shantou Woodsleep Biotechnology Co., Ltd.","address":"Room 102, 1st Floor, Building 8-2, (Shenzhen\nShantou Digital Science and Technology\nInnovation Industrial Park) No. 22 Qiaoyun Road,\nLonghu District, Shantou City \uff0c515000","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"EELHOE PERFECT DAILY LTD","address":"FLAT 46 EAGLE WORK 58 QUAKER STREET,LO\nNDON,ENGLAND E1 6SX","contact":"Zhang Jiaming","phone":"447472085998","postal_code":"E1 6SX"},"us_rep":{"company":"Postaldepot","address":"2636 Judah St, San Francisco, California, 94122-1432, United States ","contact":"Postaldepot","phone":"+1 415-759-5076","postal_code":"94122-1432"}},{"brand":"EAST MOON","distributed_by":"Shantou East Moon Biotechnology Co., Ltd.","address":"Room 111, 1st Floor, Building 8-2, (Shenzhen\nShantou Digital Science and Technology\nInnovation Industrial Park) No. 22 Qiaoyun Road,\nLonghu District, Shantou City \uff0c515000","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"EELHOE PERFECT DAILY LTD","address":"FLAT 46 EAGLE WORK 58 QUAKER STREET,LO\nNDON,ENGLAND E1 6SX","contact":"Zhang Jiaming","phone":"447472085998","postal_code":"E1 6SX"},"us_rep":{"company":"Postaldepot","address":"2636 Judah St, San Francisco, California, 94122-1432, United States ","contact":"Postaldepot","phone":"+1 415-759-5076","postal_code":"94122-1432"}},{"brand":"HOYGI","distributed_by":"Shantou Hoygi Biological Co., Ltd.","address":"Room 105, 1st Floor, Building 8-2, (Shenzhen\nShantou Digital Science and Technology\nInnovation Industrial Park) No. 22 Qiaoyun Road,\nLonghu District, Shantou City \uff0c515000","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"EELHOE PERFECT DAILY LTD","address":"FLAT 46 EAGLE WORK 58 QUAKER STREET,LO\nNDON,ENGLAND E1 6SX","contact":"Zhang Jiaming","phone":"447472085998","postal_code":"E1 6SX"},"us_rep":{"company":"Postaldepot","address":"2636 Judah St, San Francisco, California, 94122-1432, United States ","contact":"Postaldepot","phone":"+1 415-759-5076","postal_code":"94122-1432"}},{"brand":"OCEAURA","distributed_by":"Guangzhou AOHELA Biotechnology Co., Ltd.","address":"Room 0585, Area C, 2nd Floor, No. 8 Shengtang\nStreet, Cencun, Tianhe District, Guangzhou\nCity \uff0c510000","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"MJCM Product LTD","address":"Unit36 Alsup Arcade,Merseyside,\nLiverpool","contact":"MJCM Product LTD","phone":"00447825478164","postal_code":"L3 5TX"},"us_rep":{"company":"DH&C Health Food Co.Inc","address":"2311 Merced Ave South El Monte California United States","contact":"Jessica","phone":"+01 626 3766800","postal_code":"91733-2624"}},{"brand":"HOEGOA","distributed_by":"Guangzhou Hoegoa Biotechnology Co., Ltd.","address":"Room 0586, Area C, 2nd Floor, No. 8 Shengtang\nStreet, Cencun, Tianhe District, Guangzhou City","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"MJCM Product LTD","address":"Unit36 Alsup Arcade,Merseyside,\nLiverpool","contact":"MJCM Product LTD","phone":"00447825478164","postal_code":"L3 5TX"},"us_rep":{"company":"DH&C Health Food Co.Inc","address":"2311 Merced Ave South El Monte California United States","contact":"Jessica","phone":"+01 626 3766800","postal_code":"91733-2624"}},{"brand":"OUHOE","distributed_by":"Shantou Ouhoe Technology Co., Ltd.","address":"Room 106, 1st Floor, Building 8-2, (Shenzhen-\nShantou Digital Science and Technology\nInnovation Industrial Park) No. 22, Qiaoyun\nRoad, Longhu District, Shantou City, 515000","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"FM BUSINESS SERVICES LIMITED","address":"Leigh House, Brook Lane, Alderley Edge,\nCheshire, SK9 7QJ, United Kingdom","contact":"FMKJ","phone":"+44 7962502494","postal_code":"SK9 7QJ"},"us_rep":{"company":"UColor LLC","address":"75 E 3rd St Ste 7, Sheridan, Wyoming, 82801, United States","contact":"FMKJ","phone":"+1 6182806558","postal_code":"82801"}},{"brand":"EELHOE","distributed_by":"Shantou Eelhoe Daily Chemical Technology Co.,\nLtd.","address":"One of Room 402, H8 Industrial Building,\nLonghu Industrial Zone, Lianjiang Road, Longhu\nDistrict, Shantou City \uff0c515000","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"SHISEIDO UK LIMITED","address":"6th Floor, 1 Kingsway, Westminster LONDON\nUnited Kingdom","contact":"SHISEIDO UK LIMITED","phone":"+44 2038100613","postal_code":"WC2B 6AN"},"us_rep":{"company":"Blooming Cosmetics, Inc","address":"928 S Western Ave Ste 111 Los Angeles California United States","contact":"Blooming Cosmetics, Inc","phone":"+1 213368-2975","postal_code":"90006"}},{"brand":"EELHOPE","distributed_by":null,"address":null,"eu_rep":null,"uk_rep":null,"us_rep":null},{"brand":"EOHOE","distributed_by":null,"address":null,"eu_rep":null,"uk_rep":null,"us_rep":null},{"brand":"JAYSUING","distributed_by":"Shantou Jaysuing Management Consulting Co., Ltd.","address":"Room 120, Huiyi Business Building, No. 2 Keji Middle Road, High-tech Zone Shantou\uff0c515000","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"FKA BRANDS LIMITED","address":"Somerhill Business Park Five Oak Green Road TONBRIDGE, Kent ,TN11 OGP United Kingdom","contact":"Anna Smith","phone":"+44 7940509131","postal_code":"TN11 OGP"},"us_rep":{"company":"SUNFLOWER\u00a0STYLE\u00a0CO.","address":"3950\u00a0E\u00a0Costilla\u00a0Ave\u00a0Centennial,\u00a0CO,\u00a080122-2020\u00a0USA","contact":"Hannah\u00a0Grace","phone":"1-307-221-6488","postal_code":"80122"}},{"brand":"Zyvarn","distributed_by":"HK Ouhao Biotechnology Limited","address":"ROOM A1, 11/F WINNER BUILDING, 36 MAN\nYUE STREET, HUNG HOM, KOWLOON,HONG\nKONG \uff0c999077","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002    "},"uk_rep":{"company":"BAO YAN LTD","address":"Suite 9840 Moat House Business Centre, 54 Bloomfield Avenue, Belfast, Northern Ireland, BT5 5AD","contact":"BAO YAN LTD","phone":"+44 2890256709","postal_code":"BT5 5AD"},"us_rep":{"company":"ASHERIF LLC","address":"2211 E ORANGEWOOD AVE UNIT 210 ANAHEIM,CA92806","contact":"ASHERIF LLC","phone":"+1-619-8997342","postal_code":"92806"}},{"brand":"zephoco","distributed_by":"HK Timu Cross border Supply Chain Limited","address":"Unit 89, 3/F., Yau Lee Centre, No.45 Hoi Yuen\nRoad, Kwun Tong, Hong Kong \uff0c999077","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"WESLEY BAIRD LTD","address":"Suite 9844 Moat House Business\nCentre, 54 Bloomfield Avenue, Belfast,\nNorthern Ireland, BT5 5AD","contact":"WESLEY BAIRD LTD","phone":"+44 2891246809","postal_code":"BT5 5AD"},"us_rep":{"company":"DILRUBA LLC","address":"1406 W EVANS ST SAN BERNARDINO, CA92411","contact":"DILRUBA LLC","phone":"+1-619-8797632","postal_code":"92411"}},{"brand":"Moxirea","distributed_by":"HongKong KHS supply chain Limited","address":"ROOM 5042, 5/F, YAU LEE CENTRE, NO. 45, HOI\nYUEN ROAD, KWUN TONG, KOWLOON,\nHONGKONG","eu_rep":{"company":"PROCONSEIL FR","address":"8 bis rue Abel 75012 Paris, France","contact":"Sophie Dupont","phone":"+33 0780843245","postal_code":"75012"},"uk_rep":{"company":"BRITCORP SOLUTIONS LTD","address":"167-169 GREAT PORTLAND STREET,\nLondon, England","contact":"MarieDubois","phone":"+44 7395178678","postal_code":"W1W 5PF"},"us_rep":{"company":"PrimePath Consulting LLC","address":"30 N Gould St # 29084, Sheridan, WY 82801 United States","contact":"Michael Johnson","phone":"+1 3072008351","postal_code":"82801"}},{"brand":"lumavire","distributed_by":"Hong Kong Lumavire Trading Co., Limited","address":"Unit D18, 3/F Wong King Industrial Building\nNo.2-4 Tai Yau Street San Po Kong Hong Kong","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"MJCM Product LTD","address":"Unit36 Alsup Arcade,Merseyside,\nLiverpool","contact":"MJCM Product LTD","phone":"00447825478164","postal_code":"L3 5TX"},"us_rep":{"company":"DH&C Health Food Co.Inc","address":"2311 Merced Ave South El Monte California United States","contact":"Jessica","phone":"+01 626 3766800","postal_code":"91733-2624"}},{"brand":"Nymixa","distributed_by":"HK Yiouhao Biotechnology Limited","address":"RM A133 OF UNIT 1, 15/F, BLK A WAH SANG\nBLDG NO.14-18 WONG CHUK YEUNG ST,\nFOTAN NT","eu_rep":{"company":"Ubuy SAS","address":"15 AVENUE GEORGE SAND","contact":"Ubuy","phone":"+ 33 147342165","postal_code":"93210"},"uk_rep":{"company":"GAO DING LTD.","address":"Chase Business Centre, 39-41 Chase\nSide, London, United Kingdom, N14 5BP","contact":"ZUJI YU","phone":"+44 2070482982","postal_code":"N14 5BP"},"us_rep":{"company":"UNICO AMERICA CO., LTD.","address":"4781 Shadowglen Dr Colorado Springs CO 80918 ","contact":"Ayssa Gao","phone":"+1 630 8636724","postal_code":"80918"}},{"brand":"GleamXi","distributed_by":"HK GleamXi Supply Chain Co., Limited","address":"ROOM 602,6/F, KAI YUE COMMERCIAL\nBUILDING, NO.2C, ARGYLE STREET, MONGKOK\nKOWLOON, HONG KONG","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"CCL PROJECTS LTD","address":"72e New Court Way, Ormskirk, Lancashire, United Kingdom, L39 2YT","contact":"PROJECTS","phone":"+44 7712583429","postal_code":"L39 2YT"},"us_rep":{"company":"ALLOY MOVE INC","address":"3 E EVERGREEN RD #312 NEW CITY 10956 NEW YORK United States","contact":"ALLOY MOVE INC","phone":"+1 8452937218","postal_code":"10956"}},{"brand":"Zamzarah","distributed_by":"Hong Kong Zhouye Trading Co., Limited","address":"RM 102, 1/F, THE CLOUD, 111 TUNG CHAU\nSTREET, TAI KOK TSUI , HONG KONG","eu_rep":{"company":"Yutop International GmbH","address":"Hauptstr. 17, 55765 Birkenfeld,\nRheinland-Pfalz, Germany","contact":"Yutop International GmbH","phone":"+49 15258298417","postal_code":"55765"},"uk_rep":{"company":"COSMETICS LIMITED","address":"71-75 Shelton Street, COVENT GARDEN,\nLONDON WC2H 9JQ, United Kingdom","contact":"COSMETICS LIMITED","phone":"+44 2076327557","postal_code":"WC2H 9JQ"},"us_rep":{"company":"Veckridge Chemical Company, Inc.","address":"60 Central Ave, Kearny, New Jersey 07032-4603, United States","contact":"Veckridge Chemical Company, Inc.","phone":"+1 9733441818 ","postal_code":"07032-4603"}},{"brand":"\u5ba2\u6237\u5b9a\u5236\nOEM/ODM","distributed_by":"Hong Kong Alite Technology Limited","address":"RM C20, BLK C, 3/F, EAST SUN INDUSTRIAL\nCENTRE, 16 SHING YIP STREET, KWUN TONG,\nHONG KONG","eu_rep":{"company":"MOEHS CATALANA SL","address":"CALLE ROMA (INDUSTRIAL COVA\nSOLERA) 8, 08191 RUBI, Barcelona, Spain","contact":"MOEHS CATALANA SL","phone":"+34 935 86 05 20","postal_code":"08191"},"uk_rep":{"company":"MLE SKINCARE LIMITED","address":"20 Seymour Mews, LONDON W1H 6BQ,\nUnited Kingdom","contact":"MLE SKINCARE LIMITED","phone":"+44 7500 664227","postal_code":"W1H 6BQ"},"us_rep":{"company":"WACKER CHEMICAL CORPORATION","address":"13910 Oaks Ave, Chino, California 91710-7010, United States","contact":"WACKER CHEMICAL CORPORATION","phone":"+1 9095908822","postal_code":"91710-7010"}},{"brand":"AMZ","distributed_by":"HONG KONG CYRAVIS TECHNOLOGY LIMITED","address":"FLAT 2304, 23/F HO KING, COMM CENTRE, 2-16\nFA YUEN STREET,MONG KOK,HONG KONG","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"PEARL CHEMICALS LIMITED","address":"Unit 29A Whitebridge Estate,\nWhitebridge Lane, STONE ST15 8LQ, United\nKingdom","contact":"PEARL CHEMICALS LIMITED","phone":"+44 1785 819747","postal_code":"ST15 8LQ"},"us_rep":{"company":"Mitsui Chemicals America, Inc.","address":"1 N Lexington Ave FL 8, White Plains, New York 10601-1770, United States","contact":"Mitsui Chemicals America, Inc.","phone":"+1\u00a09142530777","postal_code":"10601-1770"}},{"brand":"LANISKA","distributed_by":"GOOGEER LTD\n\n(\u5305\u88c5\u4e0a\u4e0d\u663e\u793a\u201c\u5236\u9020\u5546DISTRIBUTED\u00a0BY\u201d\u548c\u201c\u5730\u5740Address\u201d\u6807\u9898)","address":"FLAT 46 EAGLE WORKS EAST 58 QUAKER STREET LONDON ENGLAND E1 6SX\n\n(\u5305\u88c5\u4e0a\u4e0d\u663e\u793a\u201c\u5236\u9020\u5546DISTRIBUTED\u00a0BY\u201d\u548c\u201c\u5730\u5740Address\u201d\u6807\u9898)","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"REBECCA TRADE LTD","address":"5 Brayford Square, London, England, E1 0SG,United Kingdom","contact":"Kathryn Rebecca","phone":"+44 1923937025","postal_code":"E1 0SG"},"us_rep":{"company":"Cro&ssant LLC","address":"30 N Gould St Ste R, Sheridan, WY 82801, United States","contact":"CROSS","phone":"+1 6187379250","postal_code":"82801"}},{"brand":"\uc218\ucd08\ub2f4 SUCHODAM \n\ud55c\ucd08\ube5b HANCHOBIT","distributed_by":"HANCHOYEANBIOTEC Co.,Ltd.\n\n(\u5305\u88c5\u4e0a\u4e0d\u663e\u793a\u201c\u5236\u9020\u5546DISTRIBUTED\u00a0BY\u201d\u548c\u201c\u5730\u5740Address\u201d\u6807\u9898)","address":"Rm 606-A416 1072 Hyohaeng-ro Hwaseong, Gyeonggi, 18405 Republic Of Korea\n\n(\u5305\u88c5\u4e0a\u4e0d\u663e\u793a\u201c\u5236\u9020\u5546DISTRIBUTED\u00a0BY\u201d\u548c\u201c\u5730\u5740Address\u201d\u6807\u9898)","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"MJCM Product LTD","address":"Unit36 Alsup Arcade,Merseyside, Liverpool","contact":"MJCM Product LTD","phone":"00447825478164","postal_code":"L3 5TX"},"us_rep":{"company":"DH&C Health Food Co.Inc","address":"2311 Merced Ave South El Monte California United States","contact":"Jessica","phone":"+01 626 3766800","postal_code":"91733-2624"}},{"brand":"HOUKEA","distributed_by":"Guangzhou Houkea Biotechnology Co., Ltd.","address":"Room 0601, Area C, 2nd Floor, No. 8 Shengtang Street, Cencun, Tianhe District, Guangzhou City,510000","eu_rep":{"company":"JK CONSEILS","address":"54 Rue Saint-Fargeau 75020 Paris, France","contact":"JK","phone":"+33 773190609","postal_code":"75020"},"uk_rep":{"company":"REP FITNESS UK LTD","address":"Windsor House, Bayshill Road, Gloucestershire/Cheltenham GL50 3AT, UNITED KINGDOM","contact":"REP","phone":"+44 7962502494","postal_code":"GL50 3AT"},"us_rep":{"company":"Guger Technologies Inc","address":"20935 E 49th Ave, Denver, CO 80249,United States","contact":"Zheng Xiyue","phone":"+1 7025455912","postal_code":"80249"}},{"brand":"ORALHOE","distributed_by":"Shantou Oralhoe Biotechnology Co., Ltd.","address":"Room 101, 1st Floor, Building 8-2, (Shenzhen Shantou Digital Science and Technology Innovation Industrial Park) No. 22 Qiaoyun Road, Longhu District, Shantou City,515000","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"NOVA ID LIMITED","address":"167-169 Great Portland Street, London, England, W1W 5PF","contact":"NOVA","phone":"+44 2075638912","postal_code":"W1W 5PF"},"us_rep":{"company":"Buckland Serassey INC","address":"1001 S.MAIN ST.STE 500KALISPELL,MT 59901 ","contact":"Boris","phone":"+1 818 579 7288","postal_code":"59901"}},{"brand":"WIYUN","distributed_by":"Shantou Wiyun Biotechnology Co., Ltd.","address":"Room 107, 1st Floor, Building 8-2, (Shenzhen Shantou Digital Science and Technology Innovation Industrial Park) No. 22 Qiaoyun Road, Longhu District, Shantou City,515000","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"NOVA ID LIMITED","address":"167-169 Great Portland Street, London, England, W1W 5PF","contact":"NOVA","phone":"+44 2075638912","postal_code":"W1W 5PF"},"us_rep":{"company":"Buckland Serassey INC","address":"1001 S.MAIN ST.STE 500KALISPELL,MT 59901 ","contact":"Boris","phone":"+1 818 579 7288","postal_code":"59901"}},{"brand":"ROXELIS","distributed_by":"Shantou Roxelis Biotechnology Co., Ltd.","address":"Room 103, 1st Floor, Building 8-2, (Shenzhen Shantou Digital Science and Technology Innovation Industrial Park) No. 22 Qiaoyun Road, Longhu District, Shantou City,515000","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"FM BUSINESS SERVICES LIMITED","address":"Leigh House, Brook Lane, Alderley Edge, Cheshire, SK9 7QJ, United Kingdom","contact":"FMKJ","phone":"+44 7962502494","postal_code":"SK9 7QJ"},"us_rep":{"company":"UColor LLC","address":"75 E 3rd St Ste 7, Sheridan, Wyoming, 82801, United States","contact":"FMKJ","phone":"+1 6182806558","postal_code":"82801"}},{"brand":"WIIEEY","distributed_by":"Shantou Wiieey Biotechnology Co., Ltd.","address":"Room 108, 1st Floor, Building 8-2, (Shenzhen Shantou Digital Science and Technology Innovation Industrial Park) No. 22 Qiaoyun Road, Longhu District, Shantou City,515000","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"NOVA ID LIMITED","address":"167-169 Great Portland Street, London, England, W1W 5PF","contact":"NOVA","phone":"+44 2075638912","postal_code":"W1W 5PF"},"us_rep":{"company":"Buckland Serassey INC","address":"1001 S.MAIN ST.STE 500KALISPELL,MT 59901 ","contact":"Boris","phone":"+1 818 579 7288","postal_code":"59901"}},{"brand":"SOUTH MOON","distributed_by":"Shantou South Moon Biotechnology Co., Ltd.","address":"Room 114, 1st Floor, Building 8-2, (Shenzhen Shantou Digital Science and Technology Innovation Industrial Park) No. 22 Qiaoyun Road, Longhu District, Shantou City,515000","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"REP FITNESS UK LTD","address":"Windsor House, Bayshill Road, Gloucestershire/Cheltenham GL50 3AT, UNITED KINGDOM","contact":"REP","phone":"+44 7962502494","postal_code":"GL50 3AT"},"us_rep":{"company":"Orion Nexus LLC","address":"1314 Laurenwood way Hghlnds Ranch,CO 80129 United States","contact":"GLENN IV THOMAS","phone":"+1 (213) 882-5090","postal_code":"80129"}},{"brand":"XIMONTH","distributed_by":"Shantou Ximonth Biotechnology Co., Ltd.","address":"Room 112, 1st Floor, Building 8-2, (Shenzhen Shantou Digital Science and Technology Innovation Industrial Park) No. 22 Qiaoyun Road, Longhu District, Shantou City,515000","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"CCL PROJECTS LTD","address":"72e New Court Way, Ormskirk, Lancashire, United Kingdom, L39 2YT","contact":"PROJECTS","phone":"+44 7712583429","postal_code":"L39 2YT"},"us_rep":{"company":"ALLOY MOVE INC","address":"3 E EVERGREEN RD #312 NEW CITY 10956 NEW YORK United States ","contact":"ALLOY MOVE INC","phone":"1-845-293-7218","postal_code":"10956"}},{"brand":"Nebluva","distributed_by":"HK Nebluva Brand Management Limited","address":"ROOM 5031, 5/F, YAU LEE CENTRE, NO. 45,HOI YUEN ROAD, KWUN TONG, KOWLOON\uff0cHONGKONG\uff0c999077","eu_rep":{"company":"HUMISS TRADING S.L","address":"Calle Luis Bu\u00f1uel 12-3A, Madrid, 28018, Spain","contact":"Sarah Zhang","phone":"+34602474012","postal_code":"28018"},"uk_rep":{"company":"OYE GLOBAL CONSULTING LTD","address":"OFFICE 10998 182-184 HIGH STREET NORTH EAST HAM LONDON UNITED KINGDOM E6 2JA","contact":"Chris Brown","phone":"+44 7378480426","postal_code":"E6 2JA"},"us_rep":{"company":"OYE Global consulting Inc","address":"169 Madison Ave STE 11911 New York 10016 US","contact":"Nancy","phone":"+1 3134133043","postal_code":"10016"}},{"brand":"Feimuko","distributed_by":"HK Feimuko Management Limited","address":"WORKSHOP 60, 3/F, BLOCK A, EAST SUN INDUSTRIAL CENTRE, NO. 16 SHING YIP STREET, KWUN TONG, HONG KONG","eu_rep":{"company":"YKT EU REP SAS","address":"BUREAU 1471, 37 PASSAGE DU PONCEAU, 75002 PARIS","contact":"Damien Tang","phone":"+33 605651273","postal_code":"75002"},"uk_rep":{"company":"SELLERCROSS LTD","address":"Unit 82a James Carter Road, Mildenhall, Bury St. Edmunds, Suffolk, IP28 7DE, United Kingdom","contact":"SellerCross","phone":"+44 7537135166","postal_code":"IP28 7DE"},"us_rep":{"company":"Buckland Serassey INC","address":"1001 S.MAIN ST.STE 500KALISPELL, MT 59901","contact":"Boris","phone":"+1 8185797288","postal_code":"59901"}},{"brand":"Cen Moon","distributed_by":"Shantou Cen Moon Biotechnology Co., Ltd.","address":"7th, 1st Floor, No.24 Pujiang Road, Longhu District, Shantou City\uff0c515000","eu_rep":{"company":"GET RICH","address":"8 bis rue Abel 75012 Paris, France","contact":"Taylor Chan","phone":"+33 745452622","postal_code":"75012"},"uk_rep":{"company":"GET RICH LTD","address":"71-75 Shelton Street, Covent Garden, London WC2H 9JQ, UNITED KINGDOM","contact":"Chris Xu","phone":"+44 7759072428","postal_code":"WC2H 9JQ"},"us_rep":{"company":"US Operations LLC","address":"30 N Gould St Ste N, Sheridan, WY 82801, United States","contact":"Edison Luo","phone":"+1 323-754-6128","postal_code":"82801"}},{"brand":"CleJoy","distributed_by":"Shantou Yuedong Cross Border E-commerce Co., Ltd.","address":"06, Room 401, Building 2, No.16, Science and Technology West Road, Gaoxin Zone, Shantou","eu_rep":{"company":"TechnoVision Solutions SARL","address":"60 rue Francois ler 75008 Paris, France","contact":"Pierre Dubois","phone":"+33 0781786046","postal_code":"75008"},"uk_rep":{"company":"OK Midtands Limited","address":"Unit 11 StirchleyTrading Estate, Hazelwell Road, Birmingham, England, \nB30 2PF","contact":"Xiaobing","phone":"+44 7577472388","postal_code":"B30 2PF"},"us_rep":{"company":"Vast Maritime Inc","address":"10276 Kentwood Dr Colorado Springs, CO 80918 United States","contact":"Chris Topher","phone":"+1 719-200-3570","postal_code":"80918"}},{"brand":"VORVITA","distributed_by":"HK Vorvita Technology Co., Limited","address":"Unit 29, 13/F, Fook Cheong Building, No.63 Hoi Yuen Road, Kwum Tong, Kowloon","eu_rep":{"company":"VAT SPEED SL","address":"ES-Calle Antonio Salvador N99.1, Madrid, Spain","contact":"VAT SPEED SL","phone":"+34 916321624","postal_code":"28026"},"uk_rep":{"company":"PRIVYSEAL LIMITED","address":"Unit A 82 James Carter Road, Mildenhall, Bury St. Edmunds, England, IP28 7DE","contact":"PRIVYSEAL LIMITED","phone":"020 3807 1946","postal_code":"IP28 7DE"},"us_rep":{"company":"Raymond James & Associates, Inc.","address":"880 Carillon Parkway, Saint Petersburg, FL 33716, United States ","contact":"Jamal","phone":"+1 7275671000","postal_code":"33716"}}];
  const CM_TO_INCH = 1 / 2.54;
  const NORMAL_DELTA_CM = 0.2;
  const INNER_CARD_DELTA_CM = 0.5;
  const AUTO_SCAN_ATTEMPTS = 10;
  const REFRESH_SCAN_ATTEMPTS = 14;
  const SCAN_INTERVAL_MS = 650;
  const TAB_CLICK_COOLDOWN_MS = 900;
  const MATERIAL_WATCH_ATTEMPTS = 4;
  const TUBE_SIZE_RULES = [
    { diameter: 19, bodies: [59, 64, 65, 75, 82, 85, 86, 88, 95, 98, 100, 104, 110, 112, 120], widths: [0.8, 1.5, 1.5, 1.5, 1.2] },
    { diameter: 22, bodies: [72, 81, 100, 110, 111], widths: [0.8, 1.75, 1.75, 1.75, 1.45] },
    { diameter: 25, bodies: [70, 75, 80, 85, 88, 90, 92, 94, 95, 97, 104, 108, 110, 114, 115, 116, 134, 135, 154], widths: [0.8, 2, 2, 2, 1.65] },
    { diameter: 30, bodies: [65, 70, 78, 80, 85, 86, 89, 90, 92, 94, 98, 100, 105, 106, 108, 109, 110, 111, 113, 114, 115, 118, 120, 122, 148], widths: [0.8, 2.375, 2.375, 2.375, 2.075] },
    { diameter: 35, bodies: [89, 96, 100, 101, 104, 105, 114, 120, 121, 125, 130, 134, 135, 140, 142, 148, 151, 155, 164], widths: [0.9, 2.75, 2.75, 2.75, 2.35] },
    { diameter: 40, bodies: [82, 90, 106, 114, 118, 122, 126, 130, 133, 134, 135, 137, 138, 140, 145, 150, 160], widths: [0.9, 3.15, 3.15, 3.15, 2.75] },
    { diameter: 45, bodies: [94, 107, 158], widths: [0.9, 3.55, 3.55, 3.55, 3.15] },
    { diameter: 50, bodies: [95, 180], widths: [0.9, 3.925, 3.925, 3.925, 3.525] },
  ];
  const TUBE_SIZE_SPECS = [
    [19, 59, [0.8, 1.5, 1.5, 1.5, 1.2], 5.8, 6.5],
    [19, 64, [0.8, 1.5, 1.5, 1.5, 1.2], 6.3, 6.5],
    [19, 65, [0.8, 1.5, 1.5, 1.5, 1.2], 6.4, 6.5],
    [19, 75, [0.8, 1.5, 1.5, 1.5, 1.2], 7.4, 6.5],
    [19, 82, [0.8, 1.5, 1.5, 1.5, 1.2], 8.1, 6.5],
    [19, 85, [0.8, 1.5, 1.5, 1.5, 1.2], 8.4, 6.5],
    [19, 86, [0.8, 1.5, 1.5, 1.5, 1.2], 8.5, 6.5],
    [19, 88, [0.8, 1.5, 1.5, 1.5, 1.2], 8.7, 6.5],
    [19, 95, [0.8, 1.5, 1.5, 1.5, 1.2], 9.4, 6.5],
    [19, 98, [0.8, 1.5, 1.5, 1.5, 1.2], 9.7, 6.5],
    [19, 100, [0.8, 1.5, 1.5, 1.5, 1.2], 9.9, 6.5],
    [19, 104, [0.8, 1.5, 1.5, 1.5, 1.2], 10.3, 6.5],
    [19, 110, [0.8, 1.5, 1.5, 1.5, 1.2], 10.9, 6.5],
    [19, 112, [0.8, 1.5, 1.5, 1.5, 1.2], 11.1, 6.5],
    [19, 120, [0.8, 1.5, 1.5, 1.5, 1.2], 11.9, 6.5],
    [22, 72, [0.8, 1.75, 1.75, 1.75, 1.45], 7.1, 7.5],
    [22, 81, [0.8, 1.75, 1.75, 1.75, 1.45], 8, 7.5],
    [22, 100, [0.8, 1.75, 1.75, 1.75, 1.45], 9.9, 7.5],
    [22, 110, [0.8, 1.75, 1.75, 1.75, 1.45], 10.9, 7.5],
    [22, 111, [0.8, 1.75, 1.75, 1.75, 1.45], 11, 7.5],
    [25, 70, [0.8, 2, 2, 2, 1.65], 6.9, 8.45],
    [25, 75, [0.8, 2, 2, 2, 1.65], 7.4, 8.45],
    [25, 80, [0.8, 2, 2, 2, 1.65], 7.9, 8.45],
    [25, 85, [0.8, 2, 2, 2, 1.65], 8.4, 8.45],
    [25, 88, [0.8, 2, 2, 2, 1.65], 8.7, 8.45],
    [25, 90, [0.8, 2, 2, 2, 1.65], 8.9, 8.45],
    [25, 92, [0.8, 2, 2, 2, 1.65], 9.1, 8.45],
    [25, 94, [0.8, 2, 2, 2, 1.65], 9.3, 8.45],
    [25, 95, [0.8, 2, 2, 2, 1.65], 9.4, 8.45],
    [25, 97, [0.8, 2, 2, 2, 1.65], 9.6, 8.45],
    [25, 104, [0.8, 2, 2, 2, 1.65], 10.3, 8.45],
    [25, 108, [0.8, 2, 2, 2, 1.65], 10.7, 8.45],
    [25, 110, [0.8, 2, 2, 2, 1.65], 10.9, 8.45],
    [25, 114, [0.8, 2, 2, 2, 1.65], 11.3, 8.45],
    [25, 115, [0.8, 2, 2, 2, 1.65], 11.4, 8.45],
    [25, 116, [0.8, 2, 2, 2, 1.65], 11.5, 8.45],
    [25, 134, [0.8, 2, 2, 2, 1.65], 13.3, 8.45],
    [25, 135, [0.8, 2, 2, 2, 1.65], 13.4, 8.45],
    [25, 154, [0.8, 2, 2, 2, 1.65], 15.3, 8.45],
    [30, 65, [0.8, 2.375, 2.375, 2.375, 2.075], 6.4, 10],
    [30, 70, [0.8, 2.375, 2.375, 2.375, 2.075], 6.9, 10],
    [30, 78, [0.8, 2.375, 2.375, 2.375, 2.075], 7.7, 10],
    [30, 80, [0.8, 2.375, 2.375, 2.375, 2.075], 7.9, 10],
    [30, 85, [0.8, 2.375, 2.375, 2.375, 2.075], 8.4, 10],
    [30, 86, [0.8, 2.375, 2.375, 2.375, 2.075], 8.5, 10],
    [30, 89, [0.8, 2.375, 2.375, 2.375, 2.075], 8.8, 10],
    [30, 90, [0.8, 2.375, 2.375, 2.375, 2.075], 8.9, 10],
    [30, 92, [0.8, 2.375, 2.375, 2.375, 2.075], 9.1, 10],
    [30, 94, [0.8, 2.375, 2.375, 2.375, 2.075], 9.3, 10],
    [30, 98, [0.8, 2.375, 2.375, 2.375, 2.075], 9.7, 10],
    [30, 100, [0.8, 2.375, 2.375, 2.375, 2.075], 9.9, 10],
    [30, 105, [0.8, 2.375, 2.375, 2.375, 2.075], 10.4, 10],
    [30, 106, [0.8, 2.375, 2.375, 2.375, 2.075], 10.5, 10],
    [30, 108, [0.8, 2.375, 2.375, 2.375, 2.075], 10.7, 10],
    [30, 109, [0.8, 2.375, 2.375, 2.375, 2.075], 10.8, 10],
    [30, 110, [0.8, 2.375, 2.375, 2.375, 2.075], 10.9, 10],
    [30, 111, [0.8, 2.375, 2.375, 2.375, 2.075], 11, 10],
    [30, 113, [0.8, 2.375, 2.375, 2.375, 2.075], 11.2, 10],
    [30, 114, [0.8, 2.375, 2.375, 2.375, 2.075], 11.3, 10],
    [30, 115, [0.8, 2.375, 2.375, 2.375, 2.075], 11.4, 10],
    [30, 118, [0.8, 2.375, 2.375, 2.375, 2.075], 11.7, 10],
    [30, 120, [0.8, 2.375, 2.375, 2.375, 2.075], 11.9, 10],
    [30, 122, [0.8, 2.375, 2.375, 2.375, 2.075], 12.1, 10],
    [30, 148, [0.8, 2.375, 2.375, 2.375, 2.075], 14.7, 10],
    [35, 89, [0.9, 2.75, 2.75, 2.75, 2.35], 8.8, 11.5],
    [35, 96, [0.9, 2.75, 2.75, 2.75, 2.35], 9.5, 11.5],
    [35, 100, [0.9, 2.75, 2.75, 2.75, 2.35], 9.9, 11.5],
    [35, 101, [0.9, 2.75, 2.75, 2.75, 2.35], 10, 11.5],
    [35, 104, [0.9, 2.75, 2.75, 2.75, 2.35], 10.3, 11.5],
    [35, 105, [0.9, 2.75, 2.75, 2.75, 2.35], 10.4, 11.5],
    [35, 114, [0.9, 2.75, 2.75, 2.75, 2.35], 11.3, 11.5],
    [35, 120, [0.9, 2.75, 2.75, 2.75, 2.35], 11.9, 11.5],
    [35, 121, [0.9, 2.75, 2.75, 2.75, 2.35], 12, 11.5],
    [35, 125, [0.9, 2.75, 2.75, 2.75, 2.35], 12.4, 11.5],
    [35, 130, [0.9, 2.75, 2.75, 2.75, 2.35], 12.9, 11.5],
    [35, 134, [0.9, 2.75, 2.75, 2.75, 2.35], 13.3, 11.5],
    [35, 135, [0.9, 2.75, 2.75, 2.75, 2.35], 13.4, 11.5],
    [35, 140, [0.9, 2.75, 2.75, 2.75, 2.35], 13.9, 11.5],
    [35, 142, [0.9, 2.75, 2.75, 2.75, 2.35], 14.1, 11.5],
    [35, 148, [0.9, 2.75, 2.75, 2.75, 2.35], 14.7, 11.5],
    [35, 151, [0.9, 2.75, 2.75, 2.75, 2.35], 15, 11.5],
    [35, 155, [0.9, 2.75, 2.75, 2.75, 2.35], 15.4, 11.5],
    [35, 164, [0.9, 2.75, 2.75, 2.75, 2.35], 16.3, 11.5],
    [40, 82, [0.9, 3.15, 3.15, 3.15, 2.75], 8.1, 13.1],
    [40, 90, [0.9, 3.15, 3.15, 3.15, 2.75], 8.9, 13.1],
    [40, 106, [0.9, 3.15, 3.15, 3.15, 2.75], 10.5, 13.1],
    [40, 114, [0.9, 3.15, 3.15, 3.15, 2.75], 11.3, 13.1],
    [40, 118, [0.9, 3.15, 3.15, 3.15, 2.75], 11.7, 13.1],
    [40, 122, [0.9, 3.15, 3.15, 3.15, 2.75], 12.1, 13.1],
    [40, 126, [0.9, 3.15, 3.15, 3.15, 2.75], 12.5, 13.1],
    [40, 130, [0.9, 3.15, 3.15, 3.15, 2.75], 12.9, 13.1],
    [40, 133, [0.9, 3.15, 3.15, 3.15, 2.75], 13.3, 13.1],
    [40, 134, [0.9, 3.15, 3.15, 3.15, 2.75], 13.3, 13.1],
    [40, 135, [0.9, 3.15, 3.15, 3.15, 2.75], 13.4, 13.1],
    [40, 137, [0.9, 3.15, 3.15, 3.15, 2.75], 13.6, 13.1],
    [40, 138, [0.9, 3.15, 3.15, 3.15, 2.75], 13.7, 13.1],
    [40, 140, [0.9, 3.15, 3.15, 3.15, 2.75], 13.9, 13.1],
    [40, 145, [0.9, 3.15, 3.15, 3.15, 2.75], 14.4, 13.1],
    [40, 150, [0.9, 3.15, 3.15, 3.15, 2.75], 14.9, 13.1],
    [40, 160, [0.9, 3.15, 3.15, 3.15, 2.75], 15.9, 13.1],
    [45, 94, [0.9, 3.55, 3.55, 3.55, 3.15], 9.3, 14.7],
    [45, 107, [0.9, 3.55, 3.55, 3.55, 3.15], 10.6, 14.7],
    [45, 158, [0.9, 3.55, 3.55, 3.55, 3.15], 15.7, 14.7],
    [50, 95, [0.9, 3.925, 3.925, 3.925, 3.525], 9.5, 16.2],
    [50, 180, [0.9, 3.925, 3.925, 3.925, 3.525], 17.9, 16.2],
  ].map(([diameter, body, widths, height, width]) => ({
    key: diameter + '\u7ba1\u5f84' + body + '\u7ba1\u8eab',
    diameter,
    body,
    widths,
    height,
    width,
  }));
  const TEMPLATE_XLSX_BASE64 = 'UEsDBAoAAAAAAIdO4kAAAAAAAAAAAAAAAAAJAAAAZG9jUHJvcHMvUEsDBBQAAAAIAIdO4kDOQlwBMQEAADkCAAAQAAAAZG9jUHJvcHMvYXBwLnhtbJ2RwUoDMRCG74LvEHKvaYuIlGyKoOJFLFi9x+xsG9hNQmZcWp/FiwfBN/Dk2yj4GGY3oFvx5G0m/88/30/kfNPUrIWI1ruCTw7GnIEzvrRuVfCb5fnomDMk7UpdewcF3wLyudrfk4voA0SygCxFOCz4mijMhECzhkbjQZJdUiofG01pjSvhq8oaOPXmvgFHYjoeHwnYELgSylH4DuQ5cdbSf0NLbzo+vF1uQwJW8iSE2hpNqaW6tCZ69BWxs42BWoqhKC9Ad+UX2kZUsqVZC4Z8ZGgfUv0pZ3caoYsteKuj1Y5SfGfLSz/XASmqj9fn97fHz6cXKZKe3/pxaB3O9lBNekMado1dQOZIwi7h0lINeFUtdKQ/gCdD4J4h42ac6zUA5ZtDvr5xuvQrW/z8ufoCUEsDBBQAAAAIAIdO4kAKSaK1UQEAAGwCAAARAAAAZG9jUHJvcHMvY29yZS54bWx9kktrwzAQhO+F/gejuyPLaZIibAf6yKmBQtMHvRQhbRy1lmwkJU7+fWU7cR1aetTO7MfMomS+V0WwA2NlqVNERhEKQPNSSJ2n6Hm1CK9RYB3TghWlhhQdwKJ5dnmR8Iry0sCjKSswToINPElbyqsUbZyrKMaWb0AxO/IO7cV1aRRz/mlyXDH+xXLAcRRNsQLHBHMMN8Cw6onoiBS8R1ZbU7QAwTEUoEA7i8mI4B+vA6PsnwutMnAq6Q6V73SMO2QL3om9e29lb6zrelSP2xg+P8Fvy4entmoodXMrDihLBKfcAHOlyTZbpvMa5KeEBA/mzQ0LZt3Sn3stQdwcshdZFuA+7ncGciZAJ/i3x6PbJh0fROCz0a7JSXkd396tFiiLo5iE0Swk8YpMKLmiUfTeRDjbb7J2A3UM8j9xGkbTlkjoZEbHswHxBMja3Of/I/sGUEsDBBQAAAAIAIdO4kBra2w6KwEAABECAAATAAAAZG9jUHJvcHMvY3VzdG9tLnhtbKWRTUvDQBCG74L/Iex9sx/5aFKSlDabgniwYO1VQrJpA9ndsLupFvG/u6VW8eBFj8M7PPPMTLZ4FYN35Nr0SuaA+Bh4XDaq7eU+B0/bNUyAZ2wt23pQkufgxA1YFLc32UarkWvbc+M5hDQ5OFg7zhEyzYGL2vguli7plBa1daXeI9V1fcOZaibBpUUU4xg1k7FKwPELBy68+dH+Fdmq5mxndtvT6HSL7BN+8jph+zYHbywqGYtwBGmVlpBgsoJpkM4gTjCmK1qu02X1Drzx3EyBJ2vhVr9/fHDYdmrsauqHdse1Qx/tfBhfjNUFxRGFhPruhj6lEU0z9B1m6OrwT5vganNX7n6Mn82qOA2SMImWcViRKolJmDK2phEjISPVMwl+E0Lna11+WXwAUEsDBAoAAAAAAIdO4kAAAAAAAAAAAAAAAAADAAAAeGwvUEsDBAoAAAAAAIdO4kAAAAAAAAAAAAAAAAAOAAAAeGwvd29ya3NoZWV0cy9QSwMEFAAAAAgAh07iQEeVPZY7BgAABRQAABgAAAB4bC93b3Jrc2hlZXRzL3NoZWV0MS54bWyNWMtu20YU3RfoP7AsEFhtQnIoy7YcSYGsty3JL9lJu6OlkUWYr5CUZe9aoIBXbRf5gWyK7Np1iqJf0wTNX/QOh8PHFWvFC8/ozLmPmfvgkLUXd7Yl3VI/MF2nLhNFkyXqTN2Z6VzX5YtJ99meLAWh4cwMy3VoXb6ngfyi8eUXtZXr3wQLSkMJNDhBXV6EobevqsF0QW0jUFyPOrAyd33bCOGnf60Gnk+NWSRkW6quaTuqbZiOzDXs+5+jw53PzSltu9OlTZ2QK/GpZYTgf7AwvUBou5t9lr6Zb6xgr8KfjIttvpLoI9tr/tnm1HcDdx4qU9dWuWvru6yq1dw+7emaooLDsg3/Zuk9A8UebO7KtMzwPtqucIiGqZ7VaqWsvECZOrEXmQMiuyoNW8sgdO22ERpyoxZF4MRXG7WZCafIQi/5dF6Xm2S/2arIsBBRLk26CjJzKTSuzqlFpyGdQa7IEsuBK9e9YcQBQBpTHhGYSmMamre0RS2rLp9XIY1eR0ZgCgbUxEJ2Lqx1o6w58aUZnRtLK2y51ktzFi7qclUhekUW+Jm76lPzehGCOxVlR5bcZWiZDh3SW2rBYl3eZsamrgWa4b9kmyzLZck27vgOuFYd3JtGRxSbIbEYF9BjgTJsORYoKzvMj0eEtmMhGGMhonPnHxGCLUSuwSiENlvajYVgFEJV5XHnoKojOzAKEaLs7T4uBIcUCcEohHYV2N4j+yHQT/hZw0QIVRQw+5hQEiCWY/zA9zYZEjEiMIlldDC0YUsEQsr9S2MLmbQhtETElsCBiV1pG4NLRHTZRIiVlU0uivCSTHwrm42JEJNMjD/DRxFkkkZZ35y3uoiznoaM/K81lRdk1AJYT2rUfHclQb8G4cAz2NOE7IMmqFmGNhkcLUKdB4DeNrSaeguNYxozDgSDFTsTaWGgjYEOBroCkBIrJG+lJxjCSh8DAwwcYuAIA0MMjDAwxsAxBk4wcIqBMwycY2CCgYsMoEJ8kiBBgUUNd0cpQ/oXxQsYEC896qEsGgcYaGGgjYEOBroY6GGgj4EBBg4xcISBIQZGGBhj4BgDJxg4xcAZBs4xMMHARQbIRQP6FouGDh0/F41qUj3AgGjA/ySv9XxeH3AGNLWEUc4zWuuM7Tyjvc6o5BkdzgAnEys7eUaXM6A5JozdPKO3ztjLM/rrflTzjAFnsOdEYoagfnJYxEHd4GjdEkEHOyygoJMd5SihD1GbNwbdrbNBrz/ZGm0/JaX6k9dLN3ze48NTPnx4+OHTw88xlOXrgj8a5gV+f//p4dcc9O+7nz6+/YtDpVJNnbPOysH8kY1zTkYNmKD4HxdQUAKccEr+4FEKnBZxUBKcFZhCWXBepAblwaSAo6M8uCjioDy45JzoVhs9e15i4BUGvsPA9xhoNteQuEpTO824Kvl9OtuhoZKjDp1ea5NbcnHDBgFoEXC/SCpCR6l8wClwl0gpKJVbnAL3hpSCsqTNKexWmHJQmnQK1KAs6ebU0KhmJp1Xk63L5vCiszXsdCdbne2nw84YhtKzcqn0TXZpzJfGsERKJZVomlb6VoN7WFxbmqJpcVU8MWzvOZ8fxQUY18nXka2v8oXSix2DR2e6P5S+fc7JnSRK3wGn5OKBsvcwtgRpklpCnKOYkz3tMsrwYcyBIdFTRhk+4pysx2WUHuMCCkqP4wIKSo8TTmG36tQZlB6nnJM9mzJKjzNhSdzTzmO92SdLGYVlgoUuMkDuiQveRdUF6/wlpqi44MVC3F7ZY5kVl/DmgANpIcMrN2OkQBsDHQx0MdDDQB8DAw6kfhxi4IgDUJ3C1eEaMuLIHqPwU+Fv8vwab1P/OnrjD6Spu3QgiDocQ4ImXxngdgfyCO+SfbjlML3JAry1z+D94NKwTBjZJx6hl70c5Jckw7Lc1YFlODf8RWLhrgaOtwxHNAiMa/h2xS60AHZ83/VzIP8wAY9iZjyvFTxY3HvUh68KN9k53wpLLH/fnNVlfzAD9TMz8Czjvi5/+OP9x7cP//z57sObHz+9+fvjL79FurOqPPBpZPjXJmzKonM4K9aCQB//nsF/hK4X+X3lhvD9Jpou4BsahUu1plQI2dMq4g+Se+66YfESbIzLdSMK22fyAa/xH1BLAwQKAAAAAACHTuJAAAAAAAAAAAAAAAAACQAAAHhsL3RoZW1lL1BLAwQUAAAACACHTuJATB2W0NsFAAAgGQAAEwAAAHhsL3RoZW1lL3RoZW1lMS54bWztWU1vGzcQvRfof1jsvZFk6yMyIge2PuImdhJESoocqV1qlxF3uSApO7oVybFAgaJp0UuB3noo2gZIgF7SX+M2RZsC+QsdclcrUqJqx8ghLWJfJO6b4ePM8A25unL1YUK9Y8wFYWnHr12q+h5OAxaSNOr4d0eDjy77npAoDRFlKe74cyz8q7sffnAF7cgYJ9gD+1TsoI4fS5ntVCoigGEkLrEMp/BswniCJHzlUSXk6AT8JrSyVa02Kwkiqe+lKAG3tyYTEmB/d+G2T8F3KoUaCCgfKqd4HRtOawoh5qJLuXeMaMeHGUJ2MsIPpe9RJCQ86PhV/edXdq9U0E5hROUGW8NuoP8Ku8IgnG7pOXk0Liet1xv15l7pXwOoXMf1W/1mv1n60wAUBLDSnIvps7Hf3u81CqwByj86fPdave2ahTf8b69x3muofwuvQbn/+hp+MOhCFC28BuX4xhq+Xm9tdesWXoNyfHMN36ru9eotC69BMSXpdA1dbTS3u4vVlpAJowdOeLtRH7S2CudLFFRDWV1qiglL5aZaS9ADxgcAUECKJEk9Oc/wBAVQv11EyZgT75BEsVTToB2MjOf5UCDWhtSMngg4yWTHv54h2BFLr69f/Pj6xTPv9Yunp4+enz765fTx49NHP+e+LMMDlEam4avvv/j720+9v5599+rJV268MPG///TZb79+6QbCPloyevn10z+eP335zed//vDEAd/jaGzCRyTBwruJT7w7LIG16cDYzPGYv5nFKEbEskAx+Ha47svYAt6cI+rC7WM7ePc4SIgLeG32wOI6jPlMEsfMN+LEAh4xRvcZdwbghprLiPBolkbuyfnMxN1B6Ng1dxelVmr7swy0k7hcdmNs0bxNUSpRhFMsPfWMTTF2rO4+IVZcj0jAmWAT6d0n3j4izpCMyNgqpKXRAUkgL3MXQUi1FZuje94+o65V9/CxjYQNgaiD/AhTK4zX0EyixOVyhBJqBvwQydhFcjjngYnrCwmZjjBlXj/EQrhsbnFYr5H0GyAf7rQf0XliI7kkU5fPQ8SYieyxaTdGSebCDkkam9iPxRRKFHm3mXTBj5i9Q9R3yANKN6b7HsFWus8WgrugnCalZYGoJzPuyOU1zKz6Hc7pBGGtMiDsll4nJD1TvPMZ3st2x9/jxLl5DlbEehPuPyjRPTRLb2PYFest6r1Cv1do/3+v0Jv28tvX5aUUg0qrw2B+4tbn72Tj8XtCKB3KOcWHQp/ABTSgcACDyk5fOnF5Hcti+Kh2Mkxg4SKOtI3HmfyEyHgYowxO7zVfOYlE4ToSXsYE3Br1sNO3wtNZcsTC/NZZq6kbZi4eAsnleLVRjsONQeboZmt5kyrda7aRvvEuCCjbNyFhTGaT2HaQaC0GVZD0/RqC5iChV/ZWWLQdLC4r94tUrbEAamVW4ITkwbmq4zfqYAJGcG1CFIcqT3mqF9nVyXybmd4UTKsCqvBSo6iAZabbiuvG5anV5aV2jkxbJIxys0noyOgeJmIU4qI61eh5aLxprtvLlFr0VCiKWBg0Wpf/jcVFcw12q9pAU1MpaOqddPzmdgNKJkBZx5/A7R0+JhnUjlAnW0QjePkVSJ5v+IsoS8aF7CER5wHXopOrQUIk5h4lScdXyy/TQFOtIZpbbQsE4Z0l1wZZedfIQdLtJOPJBAfSTLsxoiKdfwWFz7XC+VSbXxysLNkM0j2MwxNvTGf8DoISa7RqKoAhEfCKp5ZHMyTwVrIUsmX9rTSmQnbN14K6hvJxRLMYFR3FFPMcrqW8pKO/lTEwvhVrhoAaISka4ThSDdYMqtVNy66Rc9jYdc82UpEzRHPZMy1VUV3TrWLWDIs2sBLLizV5g9UixNAuzQ6fS/eq5LYXWrdyTii7BAS8jJ+j656jIRjUlpNZ1BTjdRlWml2M2r1jscAzqJ2nSRiq31y4XYlb2SOc08HghTo/2K1WLQxNFudKHWn9w4X5CwMbPwDx6MG73BmVIhcIDdr9B1BLAwQUAAAACACHTuJA0NDaQi4CAADVBAAAFAAAAHhsL3NoYXJlZFN0cmluZ3MueG1sfZRPbxJBGMbvJn6HzRybtMufuGKzbBOJ3po0WhOuGxgLCewiszR6o1a6VGkltqXERSRapcaUPylWpAS/zM7szqlfwcHlNGxJ9rLv732f2Zl5npXXXmYzwjbMo7SuRUFwJQAEqCX0ZFrbioJnm4+XI0BAhqol1YyuwSh4BRFYU+7ekREyBDaroShIGUZuVRRRIgWzKlrRc1Bj5Lmez6oGe81viSiXh2oSpSA0shkxFAhIYlZNa0BI6AXNiILwAyAUtPSLAozNChGgyCityIaCh69xY2RPLNoo4tKlc3mNy3ukWZVFQ5HFaY/XZ4/a+GgH95uk2OYZm6PHHbd7wIOgFInYw7ekeUVaJv1S5/lM1JrwwOn03fYbvup+LTFATno8sIdFBqh5QM33c+z/hzvjmtPa8We4UmLKt7DeCHeHzug7j70hfBue7axSIp+q7HEH57yA10HKVXbePCNdi23GZ1Vqmu7gwr7+TVrjm3H5yfrDm/E+P42tpjtok9Mrejrg2RQ0PpPdEt775XYHpH7Id9D6X2pW6NGEHH7jGT6r0d1zjwUXwdAiGOah+65PaubsyKpzLrKHFwux50xr4uybnPI0QqsopyZYtFhGEMxvQ6AI96SlsLQUCsbWuX4lHt+IPeWL/t5xrA8+ronH50U3Hm3ykv7Xjs0irv708bDnB14EWyPc+SjxZeaLUCAkiZIY9jEHqfVYjpc9H9zHZz/4cdz9w8LqXQbvApH9lpR/UEsDBBQAAAAIAIdO4kC0sfrP5AEAABEEAAAPAAAAeGwvd29ya2Jvb2sueG1sjVNRb5swEH6ftP9g+T0xhJAlKKQKTdAqNVWVpun2NDlwBKtgI9sZmab999kQ0k6bJp6O+/zdZ993x/zmXBboO0jFBA+xO3QwAp6IlPFjiJ938WCKkdKUp7QQHEL8AxS+WXz8MK+FfD0I8YqMAFchzrWuAkJUkkNJ1VBUwM1JJmRJtUnlkahKAk1VDqDLgowcZ0JKyjhuFQLZR0NkGUtgJZJTCVy3IhIKqs3zVc4q1amlh+aiq2YNh2FdqWHCCdi6kUsuFLyYZ6yAfesBolX1QEvT6bnAqKBKr1OmIQ2xZ1JRwxvgYyRPVXRihTmdec4Ik8XVlkdpEuvPnkGt3nCboprxVNQvLNW58dz3Jsb1FvsM7JhrA3re1LF65J1G05HRaiLizSufrJ2umZGNd+Yh5lsGzHzIu9RtFLqyhBbJo0Q2NMSZ64xmlgFnfa90E9FJshD/jPxp5Hiz0WAcu/Fg7M6cQRRNxgN/FXv+J3d1u/bjX53VZ6uYXZ3uNqBkiRRKZHqYiJK0g/trB9wpaaqB6pM0q7WYt2qBReMLegWzFri0/scFwXZlW7lU/4/4ZFa7gJ7keN+TePuw2W16cu/Xu28vcV/ychOtlv35y+12+XW3/tJdQf5pKDEzN8vVTZ50f/PiN1BLAwQUAAAACACHTuJATNr7o8gAAABnAQAAEQAAAHhsL2NlbGxpbWFnZXMueG1snc+xTsQwDAbgHYl3qLzT9BgAVde7gQqJHR7AStw2UuJEsY8cb0+k41hYEKP1y99v74/nGLoPKuITT7DrB+iIbXKe1wne317unqATRXYYEtMEnyRwPNze7EntaCmE14grSdcYlvHsygSbah6NEbtRROlTJm7pkkpEbWNZjStYW0EM5n4YHozkQuhkI9L5ksC39yctLYu3NCd7isR6IQsF1PaSbD7LVcN/3BbR83W/vfwj1Fr7mqW3bH717x4N6fNJNMUZFcEcvgBQSwMEFAAAAAgAh07iQK4Hvn9OCwAAQF8AAA0AAAB4bC9zdHlsZXMueG1s3Vxtb+NYFf6OxH+wPIIPiDaJ47x1mw7TtJZWWtBKHSQkQKM0cVqzjt11nKFdhDQwOxQWDRIaYGC1EsuuhuEDU2BB7GjZmf0zk0z7ib/Auffavucm14mTiROHVmr9dt6fc899s7evn3Zt5bbp9SzXqauFzbyqmE7LbVvOUV399k1jo6oqPb/ptJu265h19czsqdd3vvyl7Z5/ZpsHx6bpK8DC6dXVY98/2crleq1js9vsbbonpgN3Oq7Xbfpw6h3leiee2Wz3CFHXzmn5fDnXbVqOyjhsdVtJmHSb3lv9k42W2z1p+tahZVv+GeWlKt3W1utHjus1D21Q9dSrhZzhcIx112p5bs/t+JvAKud2OlbLHNOwUM555m2LeKem7mw7/a7R9XtKy+07fl3Vo0sKu/N6Gy4WVIUZ3XDboMYt5WvKta9fu5a/pbxGjr+3gc+++nbf9V/bYP/oE9+4pai5UBTmq43yZUT//eIRO8Bixm5hqWM32YVEShRHlQikbuZH7OMXBO7Xr082Uh/lP6Ys9V7IfexuYGfs/QnK5ILo7mx3XIcHWatClMmVne3eO8rtpg1popEItVzb9RQf0A5RLtCYNbsme2Jw8csXzx7Qp46bXg+ShBEWdXKNpkjwZNcCwJKLOSaD/T0kT4XSKO9VSPOODuuqYeTpD9HRWZiBkXF5wpcZl6K4OH9OEHlgdQ/6DtVOEkIhWjJj0sEFl7RZ4o5LR1Y/BoOBz6qAiiqNXgqoSB3yU4wjiDcM4uHFGTdF5Az+pF6f3ohEYEHeDILHkjqRfQmFHWK0VMewWUwkq5C0fbSwtHHzKgb5TSRyHvPGU2/B5gnOpLyF5j9NaciZQbOyYGkTUFk0ikalnFrYkGlBGhCBxfRwMi7QuFHZyydrNOcBpkSgQX4W6dIJ8VuedTNVvISenGAYjFQKiw3bBGG1BhSfhWbBRGHlUvqWBeFaKPBlRi0WFrSP14POv2Xb0ZgPKhS7srMN40/f9BwDbivB8c2zExgMODBUJimXI5RTnz7ymmcFjdaUZAQ917baRIujBh2CRDWdAIfIPQxuWE7bPDVhTFqmw44cUjipcrGyDKPRWJasRqNWW5IszYDf5ci6USK/y5HVKO8bjf3lyAJkVJYna3+3ljYOg1aF5lCKqRWJUXyLzC7lNyu1Wq1aKFer1ZpeLCxffgnk14rVWlkDNfJpQ3Xc/iKIr5RK1VKhpumFtJuAQP6SzCypqw0zkr+SMCP5Kwkz7WCln83lFYcZyV9JmJH8lYS5knLNCxqNyorDjOSvJMxI/krCTCec0s9mWAxbaW1G8lcSZiR/JWFeUhcA1g1XGmYkfyVhRvJfMcx0QAtD6EPXa8MisxIsnEJfNry2s22bHR8GrZ51dEz+++4JGcK6vg/Lsjvbbat55DpNGw5zjEsiSli0hvXpuuofW623QBibPw1GymR2n42UgSWRM11MUn7EmMCWkKRrtq1+d4IO1HJqeEgyTWvw0RwuCrlnTqFp5i7LQQx9oZumaTVbEBBXZxQLuxr5JT2VnAQ/oMckCqlzJhEgvRMqlTRJwABZFodSRnAXjfdYaifLwzlFRO25TobUekXPV/SSVmY+T2peaIcsIHzFKWkIEUWyECKChCFEFIuwka+WJLURUSSzEREktBFRzGpj2+3DRqHRZEQMJck4lWbczqkkEkun0iS1dUq+yOUYBixG07WkxPVRlCPNFCHfp9ssPD7J3KBbAL2MlmnbB6Tuf6cTdTVKeQjwaQdtpIItbmSTDdmrRQ5hij44ZN0LdrKz3bStI6drOrB1x/R8q0U2/rTg1GS7dU47I2x1ujWK8YV+cgxfpXlyYp8ZIJ9KZ2egAj/bpV0lfn4j1INfetNzfbPl0y17xLyZVaW7rNZCVeiKhsHKulPpvr+1cKpOtxKuhaooWQkU5MnKkupb/e6h6Rl0vynPFWPZyYU0LsS3L1lVGSUZtGe8RYR5PNpWxThZaM9SaLGwU0merRkOSL6tmcqkmq2ZyqSqyVSGyclJ2AUS3lykjF1Y9ci6ipDpUhWhZciKF+NUhFYisYpL6GbhRgswGHoVYMrbVShqE1ROGY2osQdgcqVI3VqdVqjOC1qt0lUaiWXQtgD6kKugGq3MVVpcKYQXFCZpZSyxydPial8BKswEzy1VR1TsIFF5dCfnwW76IzXUhGiovEHiZlRJVOAgXzOqJKofpKnLqJaoZBQg0ddAS0j1jGqJIy6MazKV4VhLoZeQKS0xLoUCnVkthYqdKS1xxLNbebCW2S09GJfZrT1IS9KpzH57STqZa6BldmsPjnh2aw/WMru1B7VE8MbEOuAyu7UHRxyOM5rjWMvs1h6My+zWHqRlMbu1B0W8mN3ag7XMbu3BEc9s7UHTkCOoTLS0ncPL/mwTAFr/L1TmWv9XTjvzbgQAG8Il67j5OXgk5M/mwNiGAHiczoixua/wDE0CF4TF/mPXs96BlTe0MyHhXoUEKoL05CruBjNhy1EZzSgKmQcnq1JZ+aHXPLlpnsKuDrZvZmx7CHJ5nP6QoGutP3Qb11p/6FCuhf6Ak3AtAlAl9NuS6/9qrcpMeJ9T3/93Dcm210nNxJxuW2bxII2abMUdrotIfLVYTvMUWhkRCsK6NKho0WSWhH41p86UwqgfmVEN5/ThIrNlJo+i8YPco+By1hmke6tm6ln9oN/zrc6ZGt8bpH1m6CWjPbPijtmoT62QD2DV1cHTp5eP30Vpfdi3bHhJinWSIUHHCO7fffHs/uDnP7t6/zchGRiByOh3hUbJLv/1ePD0JyEByWYuh74AP0rw8g/PQcjwb5EQSHpEQ9/mHqUZIN2+m/9+KA2aEURJXxAepWTqIRoyCcU1pG+bjtH8+97Vg+fDXz0K5UBkEQ37Vla4czl096efXF58cfXw4uX7716O0gN0ED19J25U5vCff7k6fy8USOZNuJKw5CmJ1+WTPw9+/d7wd+fDD/4a0pGZDETHvi40ounww/Orj34fUtDlVEQidf/l449BueGdx6I0usjJaUtSfDBxCiCJFRiy0wHrKI1aQASPBkQiRmCIKHFIQBTVEHhnTZAkjVtABI8GkkR8sG8YjAbr8vmDwb0IHQURHrBIIFGOkJx/FkkREQEz9jKSiz+9vHgYkYiYgF0aEpLhx3eGf3w0uP/bwb27ww8/j2hFXGjSQDHIj9HSNQ8eZNjUIJP7j/Phnf+E4ugCBCKRYmrw6Fn0vAgJTQqJwacX0fMiGjQpGq7u/PTF0ycRiYgF+ESoxIrB559d/v0uYHzw5OHVRx9c/uITDls6eY1skiaxlv+KsqFMZCNiBSb1JHro09mI+IFZNwmb8nQ2IqaKUkxJzInyUhOBVZQCK9YrERs6t8mdy74pOJp0sV7hbEbKlRR3sV7hbOAItVBFORzHsRI1POAGgYEUn7Fe4WxEzBalmI31CmcjtmhFKXJjvcLZiMjVpciVYCVqWYsiZuGryxLMxnqFsxExC29GSNjEeoWzEZEL7wJJ2MR6JWIDbsCh1qWto8QrEBNWb8jHpxHYdClmY73C2YiY1aWYjfUKZyMiV5ciN9YrnA34BxslRa7EKwCxwCvACjOQYjbWK5yNiFl4s0wS5FivcDYicktS5MZ6hbMRkVuSIpd125WoMdKp6XzGHAYAPvlaOn1rLhoBAArbZqfZt/2b0c26yo+/Sd9oB6bBU29at12fsqir/PgN8kI/9GbASTAx+kYP3ouH/0rfs+rqj/Z3K7W9fUPbqOZ3qxt60Sxt1Eq7exslvbG7t2fU8lq+8WOIH/m0/NZpQZ/v8+35Wq7GPjEPL+sV9K2eDR959wJjA+UP+LW6ik6Y+kT7HKjN/lIjcr3o0/c7/wNQSwMECgAAAAAAh07iQAAAAAAAAAAAAAAAAAYAAABfcmVscy9QSwMEFAAAAAgAh07iQHs4drz/AAAA3wIAAAsAAABfcmVscy8ucmVsc62Sz0rEMBDG74LvEOa+TXcVEdl0LyLsTWR9gJhM/9AmE5JZ7b69QVEs1LoHj5n55pvffGS7G90gXjGmjryCdVGCQG/Idr5R8Hx4WN2CSKy91QN5VHDCBLvq8mL7hIPmPJTaLiSRXXxS0DKHOymTadHpVFBAnzs1Rac5P2Mjgza9blBuyvJGxp8eUE08xd4qiHu7BnE4hbz5b2+q687gPZmjQ88zK+RUkZ11bJAVjIN8o9i/EPVFBgY5z3J1Psvvd0qHrK1mLQ1FXIWYU4rc5Vy/cSyZx1xOH4oloM35QNPT58LBkdFbtMtIOoQlouv/JDLHxOSWeT41X0hy8i2rd1BLAwQKAAAAAACHTuJAAAAAAAAAAAAAAAAACQAAAHhsL19yZWxzL1BLAwQUAAAACACHTuJAA4jdgBQBAAAiAwAAGgAAAHhsL19yZWxzL3dvcmtib29rLnhtbC5yZWxzrZLLasMwEEX3hf6D0L4e231QSuRsSsHb1v0AIY8fRJaERq2bv6+SQuI4wd1kI5gZdM+dx2r9M2j2jZ56awTPkpQzNMrWvWkF/6ze7p45oyBNLbU1KPgWia+L25vVO2oZ4ifqekcsqhgSvAvBvQCQ6nCQlFiHJlYa6wcZYuhbcFJtZIuQp+kT+KkGL040WVkL7sv6kbNq6yL5f23bNL3CV6u+BjThAgIobHVsgFXStxgE/4uT6JHDZfzDDD+OYzI6SpSBM1yegkKtyyE2eGTsUv0uRUuc+xlnYYRn3PkkgTrpsf4IPm5x2u00vWQmv6aZEG9hMo59CPs3W/KQXdPDaP2GOsRwXMshRXFcsXIwAyeXXfwCUEsDBAoAAAAAAIdO4kAAAAAAAAAAAAAAAAAUAAAAeGwvd29ya3NoZWV0cy9fcmVscy9QSwMEFAAAAAgAh07iQBGnRzL4AQAAvAIAACMAAAB4bC93b3Jrc2hlZXRzL19yZWxzL3NoZWV0MS54bWwucmVsc4WSS4/aMBSF95X6H1AW3eUJJKQlIJhABhiGKYTnJjKxSQyJbWzzCL++FlWljlSpy3Ntf/fec9zu3suidkVcYEoCzTYsrYZISiEmWaAt46He0mpCAgJBQQkKtAoJrdv5+qU9RwWQ6pHIMRM1RSEi0HIp2XfTFGmOSiAMyhBRJwfKSyCV5JnJQHoCGTIdy3JN/jdD63xi1kYw0PgI2lotrpjq/H82PRxwikKaXkpE5D9amLki8QKTk4ICniH5GyvUzLfbzQAleFBipLQ0d4DlHOiLEyZ6H+lSIq73iMR6L1PW6DNlGcFZLvU1V7gCCRMys29Fu9Cdv2w8tdohEDyxE7vhdyHeB6gaO6MjxdPF2Df6x9Z2knqrwU9osbftx/u0HFYxdV0YHbJ6az20/fB9/1Fnqb7DKc578bbZekWhu07YUSSOxBt4TMgEeFET8l1vwNdNJ47PVzQ4x0dwLqIKzNN+PGlku+3rbfSy6ScXOLm6q9DfMNzDyYWuFyKaownX7STqj1dOdTOo2BZ8uSST+HFxHtY5H5OelQ9CfMrcerI5zIR+H6wb4eyUfgMl+6H2SiTIAoGe8oxhYHtey6u7vu89S8okGDh+w7ZV4Lb9rIlgj8BFVk9xZ+oCT+VjGrcueZHFmz/RTClUqQ/uynkCCs3stM1Pf67zC1BLAwQUAAAACACHTuJA7Omivn8BAAB1BQAAEwAAAFtDb250ZW50X1R5cGVzXS54bWyllMtuwjAQRfeV+g+Rt1Vi6KKqKgKLPpYtUukHuPZALPySx7z+vpNQKhFRSMQmkmPPPXeuJxlNttZka4iovSvZsBiwDJz0SrtFyb5mb/kjyzAJp4TxDkq2A2ST8e3NaLYLgBlVOyxZlVJ44hxlBVZg4QM42pn7aEWiZVzwIORSLIDfDwYPXHqXwKU81RpsPHqBuViZlL1u6fXeSQSDLHveH6xZJRMhGC1FIqd87VSLkv8SCqpszmClA96RDcZPEuqd/wG/dR8UTdQKsqmI6V1YssGVl9PoA3IyVJxXOWHTz+daAmmsLEVQQN2yApUHkoSYNPx5PsuWPkJ/+CGjuro3cYXJ2/7MVsOykekI3xouwRhtaXSwA3oTMG/zDvWHUTgVK3GwEhHUZ4o0+V1QxzPepmKIIBRWAMma4kj7ko+0M5167WWgEb1ATvTxAm+eww5Zn+c3MheAGx+X394vr4a106bUCyu068Bvrgjp9qnm+q6PjdT9NcIHH7z5aY5/AFBLAQIUABQAAAAIAIdO4kDs6aK+fwEAAHUFAAATAAAAAAAAAAEAIAAAAF4nAABbQ29udGVudF9UeXBlc10ueG1sUEsBAhQACgAAAAAAh07iQAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAQAAAANCIAAF9yZWxzL1BLAQIUABQAAAAIAIdO4kB7OHa8/wAAAN8CAAALAAAAAAAAAAEAIAAAAFgiAABfcmVscy8ucmVsc1BLAQIUAAoAAAAAAIdO4kAAAAAAAAAAAAAAAAAJAAAAAAAAAAAAEAAAAAAAAABkb2NQcm9wcy9QSwECFAAUAAAACACHTuJAzkJcATEBAAA5AgAAEAAAAAAAAAABACAAAAAnAAAAZG9jUHJvcHMvYXBwLnhtbFBLAQIUABQAAAAIAIdO4kAKSaK1UQEAAGwCAAARAAAAAAAAAAEAIAAAAIYBAABkb2NQcm9wcy9jb3JlLnhtbFBLAQIUABQAAAAIAIdO4kBra2w6KwEAABECAAATAAAAAAAAAAEAIAAAAAYDAABkb2NQcm9wcy9jdXN0b20ueG1sUEsBAhQACgAAAAAAh07iQAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAQAAAAYgQAAHhsL1BLAQIUAAoAAAAAAIdO4kAAAAAAAAAAAAAAAAAJAAAAAAAAAAAAEAAAAIAjAAB4bC9fcmVscy9QSwECFAAUAAAACACHTuJAA4jdgBQBAAAiAwAAGgAAAAAAAAABACAAAACnIwAAeGwvX3JlbHMvd29ya2Jvb2sueG1sLnJlbHNQSwECFAAUAAAACACHTuJATNr7o8gAAABnAQAAEQAAAAAAAAABACAAAADEFQAAeGwvY2VsbGltYWdlcy54bWxQSwECFAAUAAAACACHTuJA0NDaQi4CAADVBAAAFAAAAAAAAAABACAAAABTEQAAeGwvc2hhcmVkU3RyaW5ncy54bWxQSwECFAAUAAAACACHTuJArge+f04LAABAXwAADQAAAAAAAAABACAAAAC7FgAAeGwvc3R5bGVzLnhtbFBLAQIUAAoAAAAAAIdO4kAAAAAAAAAAAAAAAAAJAAAAAAAAAAAAEAAAACALAAB4bC90aGVtZS9QSwECFAAUAAAACACHTuJATB2W0NsFAAAgGQAAEwAAAAAAAAABACAAAABHCwAAeGwvdGhlbWUvdGhlbWUxLnhtbFBLAQIUABQAAAAIAIdO4kC0sfrP5AEAABEEAAAPAAAAAAAAAAEAIAAAALMTAAB4bC93b3JrYm9vay54bWxQSwECFAAKAAAAAACHTuJAAAAAAAAAAAAAAAAADgAAAAAAAAAAABAAAACDBAAAeGwvd29ya3NoZWV0cy9QSwECFAAKAAAAAACHTuJAAAAAAAAAAAAAAAAAFAAAAAAAAAAAABAAAADzJAAAeGwvd29ya3NoZWV0cy9fcmVscy9QSwECFAAUAAAACACHTuJAEadHMvgBAAC8AgAAIwAAAAAAAAABACAAAAAlJQAAeGwvd29ya3NoZWV0cy9fcmVscy9zaGVldDEueG1sLnJlbHNQSwECFAAUAAAACACHTuJAR5U9ljsGAAAFFAAAGAAAAAAAAAABACAAAACvBAAAeGwvd29ya3NoZWV0cy9zaGVldDEueG1sUEsFBgAAAAAUABQA2QQAAA4pAAAAAA==';

  const L = {
    title: '\u0050\u004c\u004d\u60ac\u6d6e\u52a9\u624b',
    mini: '\u0050\u004c\u004d',
    refresh: '\ud83d\udd04',
    about: '\u2699\ufe0f',
    openDetail: '\ud83d\udcc2',
    collapse: '\u6536\u8d77',
    close: '\u5173\u95ed',
    copyAll: '\u5168\u90e8\u590d\u5236',
    copy: '\u2702\ufe0f',
    copied: '\u5df2\u590d\u5236',
    copyHint: '\u70b9\u51fb\u590d\u5236',
    edit: '\u7f16\u8f91',
    ok: '\u786e\u5b9a',
    invalidCm: '\u8bf7\u8f93\u5165\u6b63\u786e\u7684cm\u6570\u503c',
    search: '\u641c\u7d22',
    clearSearch: '\u6e05\u7a7a',
    searchPlaceholder: '\u641c\u7d22\u4ea7\u54c1\u540d/SKU/\u7269\u6599\u7f16\u7801',
    searchResult: '\u641c\u7d22\u7ed3\u679c',
    noSearchResult: '\u6ca1\u627e\u5230\u76f8\u5173\u4ea7\u54c1',
    pin: '\ud83d\udd1d',
    unpin: '\ud83d\udd1d',
    scanning: '\u6b63\u5728\u8bc6\u522b...',
    cached: '\u5df2\u8bfb\u53d6\u672c\u5730\u5b58\u50a8\uff0c\u5982\u9700\u91cd\u65b0\u8bc6\u522b\u8bf7\u70b9\u5237\u65b0',
    checkingMaterial: '\u5df2\u547d\u4e2d\u7f13\u5b58\uff0c\u6b63\u5728\u68c0\u67e5\u7269\u6599\u6e05\u5355\u5c3a\u5bf8...',
    noDrawer: '\u672a\u6253\u5f00\u9879\u76ee\u8be6\u60c5\uff0c\u53ef\u4ece\u5de6\u4fa7\u9009\u62e9\u5df2\u5b58\u50a8\u7f16\u7801\u67e5\u770b',
    scanDone: '\u672c\u8f6e\u8bc6\u522b\u5df2\u505c\u6b62',
    emptyList: '\u6682\u65e0\u5b58\u50a8\u8bb0\u5f55',
    fileSection: '\u6587\u4ef6\u89c4\u683c',
    graphicSection: '\u56fe\u5305\u4fe1\u606f',
    item: '\u9879\u76ee',
    size: '\u5c3a\u5bf8',
    action: '\u64cd\u4f5c',
    sku: '\u7f16\u7801',
    name: '\u4ea7\u54c1\u540d',
    brand: '\u54c1\u724c',
    packageSize: '\u7eb8\u76d2/\u5370\u5237\u888b\u5c3a\u5bf8',
    printSize: '\u6807\u7b7e/\u5370\u5237\u5c3a\u5bf8',
    packageCode: '\u7eb8\u76d2\u7f16\u7801',
    printCode: '\u6807\u7b7e/\u5370\u5237\u7f16\u7801',
    cartonLength: '\u7eb8\u76d2-\u957f',
    cartonWidth: '\u7eb8\u76d2-\u5bbd',
    cartonHeight: '\u7eb8\u76d2-\u9ad8',
    productLength: '\u4ea7\u54c1-\u957f',
    tailSealLength: '\u5c01\u5c3e\u957f\u5ea6',
    productWidth: '\u4ea7\u54c1-\u5bbd',
    productHeight: '\u4ea7\u54c1-\u9ad8',
    netContent: '\u51c0\u542b\u91cf',
    grossWeight: '\u6bdb\u91cd',
    materialTab: '\u7269\u6599\u6e05\u5355',
    productTab: '\u4ea7\u54c1\u4fe1\u606f',
    unknown: '\u672a\u8bc6\u522b',
    noPackage: '\u672a\u8bc6\u522b',
    noPrint: '\u672a\u8bc6\u522b',
    noDimension: '\u65e0\u53ef\u7528\u4e09\u7ef4\u5c3a\u5bf8',
    sourceMaterial: '\u6765\u6e90\uff1a\u7269\u6599\u6e05\u5355',
    sourceOuter: '\u6765\u6e90\uff1a\u4ea7\u54c1\u4fe1\u606f\u5916\u5305\u88c5',
    updatedAt: '\u66f4\u65b0',
    pluginName: '\u63d2\u4ef6\u540d',
    version: '\u5f53\u524d\u7248\u672c',
    cachedCount: '\u5df2\u5b58\u50a8\u7f16\u7801\u6570\u91cf',
    storageNote: '\u5b58\u50a8\u4f4d\u7f6e\u8bf4\u660e',
    storageNoteText: '\u6570\u636e\u5b58\u5728 Tampermonkey/Violentmonkey \u7684\u811a\u672c\u672c\u5730\u5b58\u50a8\u4e2d\uff0c\u6e05\u7406\u6269\u5c55\u6570\u636e\u6216\u5378\u8f7d\u811a\u672c\u53ef\u80fd\u4f1a\u4e22\u5931\u3002',
    excelKeywordSetting: '\u8868\u683c\u5173\u952e\u8bcd',
    excelKeywordBrandName: '\u54c1\u724c \u4ea7\u54c1\u540d',
    excelKeywordEnglish: '\u82f1\u6587\u540d',
    excelDownloadSetting: '\u56fe\u5305\u4e0b\u8f7d\u65b9\u5f0f',
    excelDownloadPicker: '\u5f39\u51fa\u9009\u9879\u6846',
    excelDownloadDirect: '\u76f4\u63a5\u4e0b\u8f7d',
    exportTypeExcel: '\u751f\u6210 Excel',
    exportTypeToyLabel: '\u73a9\u5177\u6807\u7b7e',
    labelGenerating: '\u6b63\u5728\u751f\u6210\u6807\u7b7e...',
    labelDone: '\u6807\u7b7e\u5df2\u751f\u6210',
    labelFailed: '\u751f\u6210\u6807\u7b7e\u5931\u8d25',
    labelNeedBarcode: '\u672a\u627e\u5230 PLM \u6761\u7801\u6587\u4ef6\uff0c\u5df2\u6539\u7528 SKU \u751f\u6210\u6761\u7801',
    easterEgg: '\ud83d\udc14\ud83d\udc14\ud83d\udc14\ud83d\udc14\ud83d\udc14\ud83d\udc14\ud83d\udc14\ud83d\udc14\ud83d\udc14',
    exportCache: '\u5bfc\u51fa\u7f13\u5b58',
    importCache: '\u5bfc\u5165\u7f13\u5b58',
    importDone: '\u7f13\u5b58\u5df2\u5bfc\u5165',
    importFailed: '\u5bfc\u5165\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u6587\u4ef6',
    cloudBackupTitle: '\u4e91\u5907\u4efd',
    cloudBackupKey: '\u5907\u4efd\u5bc6\u94a5',
    cloudBackupPlaceholder: '\u8f93\u5165\u81ea\u5df1\u7684\u5907\u4efd\u5bc6\u94a5',
    cloudBackupSave: '\u4e0a\u4f20\u5907\u4efd',
    cloudBackupRestore: '\u6062\u590d\u5907\u4efd',
    cloudBackupSaving: '\u6b63\u5728\u4e0a\u4f20\u4e91\u5907\u4efd...',
    cloudBackupSaved: '\u4e91\u5907\u4efd\u5df2\u4e0a\u4f20',
    cloudBackupReady: '\u672a\u8fde\u63a5',
    cloudBackupSavedAt: '\u5df2\u4e0a\u4f20',
    cloudBackupRestoring: '\u6b63\u5728\u6062\u590d\u4e91\u5907\u4efd...',
    cloudBackupRestored: '\u4e91\u5907\u4efd\u5df2\u6062\u590d',
    cloudBackupMissingKey: '\u8bf7\u5148\u586b\u5199\u5907\u4efd\u5bc6\u94a5',
    cloudBackupKeyTooShort: '\u5907\u4efd\u5bc6\u94a5\u81f3\u5c11 4 \u4f4d',
    cloudBackupOwnerMissing: '\u672a\u8bfb\u53d6\u5230\u5f53\u524d PLM \u59d3\u540d\uff0c\u5df2\u53d6\u6d88\u4e0a\u4f20',
    cloudBackupNotFound: '\u672a\u627e\u5230\u8fd9\u4e2a\u5bc6\u94a5\u7684\u4e91\u5907\u4efd',
    cloudBackupFailed: '\u4e91\u5907\u4efd\u5931\u8d25',
    cloudBackupHint: '\u586b\u5199\u540e\u4f1a\u4fdd\u5b58\u5728\u672c\u5730 PLM \u811a\u672c\u91cc\uff0c\u6bcf\u6b21\u65b0\u589e/\u66f4\u65b0\u7f16\u7801\u540e\u81ea\u52a8\u5907\u4efd\u4e00\u6b21\u3002',
    excel: '\u5bfc\u51fa',
    excelPackQty: '\u88c5\u7bb1\u6570',
    excelPurchasePrice: '\u4ef7\u683c',
    excelGenerating: '\u6b63\u5728\u751f\u6210 Excel...',
    excelImageLoading: '\u6b63\u5728\u4e0b\u8f7d\u4ea7\u54c1\u56fe...',
    excelPacking: '\u6b63\u5728\u63d2\u5165\u4ea7\u54c1\u56fe...',
    excelDownloading: '\u6b63\u5728\u4fdd\u5b58\u6587\u4ef6...',
    excelRefresh: '\u91cd\u65b0\u83b7\u53d6',
    excelPreparing: '\u6b63\u5728\u83b7\u53d6\u8868\u683c\u4fe1\u606f...',
    excelReady: '\ud83d\udfe2 \u8868\u683c\u4fe1\u606f\u5df2\u5b8c\u6574',
    excelPackRecommended: '\u5df2\u586b\u5165\u63a8\u8350\u88c5\u7bb1\u6570',
    excelMissing: '\ud83d\udd34 \u7f3a\u5931\uff1a',
    excelIncomplete: '\ud83d\udd34 \u4fe1\u606f\u4e0d\u5b8c\u6574',
    excelDone: '\u5df2\u751f\u6210 Excel',
    excelFailed: '\u751f\u6210 Excel \u5931\u8d25',
    excelSaveCanceled: '\u5df2\u53d6\u6d88\u4fdd\u5b58',
    excelSavePickerUnavailable: '\u6d4f\u89c8\u5668\u53e6\u5b58\u4e3a\u63a5\u53e3\u4e0d\u53ef\u7528\uff0c\u5df2\u6539\u7528\u666e\u901a\u4e0b\u8f7d',
    excelNeedData: '\u8bf7\u5148\u9009\u4e2d\u4e00\u4e2a\u5df2\u8bc6\u522b\u7684\u4ea7\u54c1',
    excelNeedLibrary: '\u0045\u0078\u0063\u0065\u006c\u004a\u0053 \u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u7f51\u7edc\u6216\u811a\u672c\u6743\u9650',
    openingDetail: '\u6b63\u5728\u6253\u5f00\u8be6\u60c5...',
    openDetailDone: '\u5df2\u6253\u5f00\u8be6\u60c5',
    openDetailFailed: '\u672a\u627e\u5230\u5bf9\u5e94\u8be6\u60c5',
    uploadSection: '\u63d0\u5ba1\u4e0a\u4f20',
    uploadIcon: '\ud83d\udce4',
    uploadToggle: '\u4e0a\u4f20',
    uploadXlsx: 'XLSX',
    uploadZip: 'ZIP',
    uploadDropHint: '\u628a xlsx/zip \u62d6\u5230\u8fd9\u91cc\uff0c\u6309\u6587\u4ef6\u540d\u91cc\u7684 SKU \u81ea\u52a8\u52a0\u5165\u961f\u5217',
    uploadStartQueue: '\u5f00\u59cb\u961f\u5217',
    uploadPauseQueue: '\u6682\u505c',
    uploadWorker: '\u4e13\u7528\u4e0a\u4f20\u9875',
    uploadQueueEmpty: '\u961f\u5217\u6682\u7a7a',
    uploadHistoryEmpty: '\u6682\u65e0\u4e0a\u4f20\u5386\u53f2',
    uploadHistory: '\u5386\u53f2\u8bb0\u5f55',
    uploadQueueView: '\u8fd4\u56de\u961f\u5217',
    uploadClearList: '\u6e05\u7a7a\u5217\u8868',
    uploadSelectedRetry: '\u91cd\u8bd5\u9009\u4e2d',
    uploadSelectedDelete: '\u5220\u9664\u9009\u4e2d',
    uploadClearConfirm: '\u786e\u5b9a\u8981\u6e05\u7a7a\u5f53\u524d\u5217\u8868\u5417\uff1f',
    uploadCompletedAt: '\u5b8c\u6210\u65f6\u95f4',
    uploadNoSkuInFile: '\u6587\u4ef6\u540d\u91cc\u6ca1\u627e\u5230 SKU',
    uploadQueued: '\u5df2\u52a0\u5165\u4e0a\u4f20\u961f\u5217',
    uploadQueueStarted: '\u961f\u5217\u5df2\u5f00\u59cb',
    uploadQueuePaused: '\u961f\u5217\u5df2\u6682\u505c',
    uploadRetry: '\u91cd\u8bd5',
    uploadDelete: '\u5220\u9664',
    uploadSuccess: '\u63d0\u5ba1\u6210\u529f',
    uploadDraftSaved: '\u5df2\u4fdd\u5b58\u8349\u7a3f',
    uploadExistingContent: '\u5df2\u6709\u5185\u5bb9',
    uploadFailed: '\u4e0a\u4f20\u5931\u8d25',
    uploadFileTooLarge: '\u56fe\u5305\u8d85\u8fc7 100MB\uff0c\u5df2\u8df3\u8fc7',
    backgroundAutomationTitle: '\u540e\u53f0\u81ea\u52a8\u5316\u63d0\u793a',
    backgroundAutomationText: '\u5982\u9700\u8ba9\u6d4f\u89c8\u5668\u5728\u540e\u53f0\u7a33\u5b9a\u6267\u884c\u6279\u91cf\u4e0a\u4f20\uff0c\u5efa\u8bae\u5728 Chrome \u5feb\u6377\u65b9\u5f0f\u7684\u76ee\u6807\u8def\u5f84\u672b\u5c3e\u8ffd\u52a0\u542f\u52a8\u53c2\u6570\uff1a --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-gpu-sandbox --no-sandbox\u3002\u4fee\u6539\u540e\u9700\u5b8c\u5168\u9000\u51fa\u5e76\u91cd\u65b0\u542f\u52a8 Chrome \u624d\u4f1a\u751f\u6548\u3002',
    panelPin: '\u5173\u95ed',
    settingsTitle: '\u8bbe\u7f6e',
    logTitle: '\u8fd0\u884c\u65e5\u5fd7',
    logCopy: '\u590d\u5236\u65e5\u5fd7',
    logClear: '\u6e05\u7a7a\u65e5\u5fd7',
    logEmpty: '\u6682\u65e0\u65e5\u5fd7',
    insightsTitle: '\u6570\u636e\u6d1e\u5bdf',
    insightsExport: '\u5bfc\u51fa\u6d1e\u5bdf',
    insightsClear: '\u6e05\u7a7a\u6d1e\u5bdf',
    insightsEmpty: '\u6682\u65e0\u6570\u636e',
    insightsCloudSummary: '\u4e91\u7aef\u6458\u8981',
    insightsCopyReport: '\u590d\u5236\u603b\u7ed3',
    insightsCopyFeishu: '\u590d\u5236\u98de\u4e66\u8868',
    insightsCopyAi: '\u590d\u5236 AI \u6574\u7406',
    insightsCopyRules: '\u590d\u5236\u6e05\u6d17\u89c4\u5219',
    insightsSyncFeishu: '\u540c\u6b65\u98de\u4e66',
    insightsCheckFeishu: '\u68c0\u67e5\u98de\u4e66',
    insightsCopyFeishuSetup: '\u590d\u5236\u98de\u4e66\u914d\u7f6e',
    insightsCheckAi: '\u68c0\u67e5 AI',
    insightsAiModel: 'AI \u6a21\u578b',
    loadingTipsManage: '\u7ef4\u62a4\u5c0f\u63d0\u793a',
  };
  const DEFAULT_LOADING_TIPS = [
    '\u591a\u4e2a\u7f16\u7801\u53ef\u4ee5\u4e00\u884c\u4e00\u4e2a\u7c98\u8fdb\u641c\u7d22\u6846\uff0c\u811a\u672c\u4f1a\u81ea\u52a8\u62c6\u5f00\u3002',
    '\u53cc\u51fb\u7d2b\u8272 SKU \u80fd\u5feb\u901f\u590d\u5236\u7f16\u7801\uff0c\u6838\u5bf9\u6587\u4ef6\u540d\u65f6\u6700\u7701\u624b\u3002',
    '\u53f3\u4e0b\u89d2\u5237\u65b0\u4f1a\u91cd\u65b0\u8bfb\u53d6\u8be6\u60c5\uff0c\u9002\u5408\u9875\u9762\u521a\u52a0\u8f7d\u5b8c\u7684\u4ea7\u54c1\u3002',
    '\u76f8\u540c\u7eb8\u76d2\u5c3a\u5bf8\u586b\u8fc7\u88c5\u7bb1\u6570\uff0c\u4e0b\u6b21\u751f\u6210 Excel \u4f1a\u81ea\u52a8\u63a8\u8350\u3002',
    '\u91c7\u8d2d\u4fe1\u606f\u4e3a\u7a7a\u65f6\uff0c\u961f\u5217\u4f1a\u5148\u4fdd\u5b58\u8349\u7a3f\u518d\u7ee7\u7eed\uff0c\u4e0d\u8981\u624b\u52a8\u6253\u65ad\u3002',
    '\u8bbe\u7f6e\u91cc\u7684\u8fd0\u884c\u65e5\u5fd7\u80fd\u770b\u51fa\u5361\u5728\u54ea\u4e00\u6b65\uff0c\u6bd4\u53ea\u770b\u5f39\u7a97\u66f4\u51c6\u3002',
    '\u73a9\u5177\u6807\u7b7e\u4f1a\u56fa\u5b9a\u751f\u6210 4x3cm \u5370\u5237\u56fe\uff0c\u4e0d\u8ddf\u968f\u666e\u901a\u5370\u5237\u5c3a\u5bf8\u8dd1\u3002',
    '\u6709\u65e7\u5185\u5bb9\u7684\u63d0\u5ba1\u9879\u5148\u6807\u8bb0\u4e3a\u5df2\u6709\u5185\u5bb9\uff0c\u52fe\u9009\u91cd\u8bd5\u65f6\u624d\u4f1a\u6e05\u7406\u91cd\u4f20\u3002',
  ];
  const TOOLTIP = {
    about: '\u5173\u4e8e',
    openDetail: '\u6253\u5f00\u5f53\u524d\u7f16\u7801\u7684\u9879\u76ee\u8be6\u60c5',
    refresh: '\u5237\u65b0',
    copy: '\u590d\u5236',
    pin: '\u7f6e\u9876',
    unpin: '\u53d6\u6d88\u7f6e\u9876',
    panelPin: '\u5173\u95ed\u60ac\u6d6e\u7a97',
    collapse: '\u5173\u95ed',
    search: '\u641c\u7d22',
    excel: '\u5bfc\u51fa',
  };

  const firstTutorial = !loadTutorialSeen();
  const state = {
    drawer: null,
    sku: '',
    selectedSku: '',
    data: null,
    index: loadIndex(),
    expanded: false,
    scanTimer: 0,
    scanAttempts: 0,
    maxAttempts: AUTO_SCAN_ATTEMPTS,
    scanRunning: false,
    scanTargetSku: '',
    scanData: null,
    seenMaterial: false,
    seenProduct: false,
    seenDesign: false,
    scanTabCounts: {},
    observedDrawer: null,
    observedSku: '',
    observedTab: '',
    manualCollectTimer: 0,
    diagnosticRunning: false,
    nextTabTarget: L.materialTab,
    lastTabClickAt: 0,
    toastTimer: 0,
    materialWatchTimer: 0,
    materialWatchAttempts: 0,
    ignoreOutsideClickUntil: 0,
    splitWidth: loadSplitWidth(),
    panelSize: loadPanelSize(),
    developerSettingsTapCount: 0,
    developerSettingsTapAt: 0,
    developerInsightsUnlocked: false,
    developerToolsOpen: false,
    tutorialModalOpen: firstTutorial,
    settingsReturnView: '',
    searchQuery: '',
    view: firstTutorial ? 'home' : 'home',
    settings: loadSettings(),
    excelPanelOpen: false,
    excelExtra: null,
    excelMissing: [],
    excelStatus: '',
    excelPackQty: '',
    excelPurchasePrice: '6',
    insightRecommendationSku: '',
    insightRecommendationLoading: false,
    insightRecommendation: null,
    exportType: 'excel',
    exportMenuOpen: false,
    copywritingMode: false,
    copywritingLoading: false,
    copywritingError: '',
    copywritingStatus: '',
    openingProjectDetail: false,
    openingProjectDetailSku: '',
    uploadExpanded: false,
    uploadReturnView: '',
    uploadQueue: loadUploadQueue(),
    uploadHistory: loadUploadHistory(),
    uploadRunning: loadUploadWorkerRunning(),
    uploadProcessing: false,
    uploadView: 'queue',
    uploadMode: 'standard',
    toyLabelSkuInput: '',
    toyLabelBatchFiles: [],
    toyLabelBatchPreparedSignature: '',
    toyLabelBatchRows: {},
    projectListPrefetchTimer: 0,
    projectListPrefetchSignature: '',
    uploadGuideOpen: false,
    uploadPage: 1,
    uploadHistoryPage: 1,
    uploadSelectedIds: [],
    ledgerRecords: loadDailyLedger(),
    ledgerDate: getTodayKey(),
    ledgerView: 'design',
    ledgerTimeEditor: null,
    ledgerMenuSku: '',
    ledgerFlowTransitionSku: '',
    ledgerFlowTransitionTimer: 0,
    ledgerTabTransition: '',
    ledgerTabTransitionTimer: 0,
    manuallyCollapsedForSku: '',
    userCollapsedPanel: false,
    launcherClickAt: 0,
    launcherSuppressClickUntil: 0,
    thumbHydratingSku: '',
    thumbHydrateFailedAt: {},
    thumbHydratedSkus: new Set(),
    skuPage: 1,
    sizeImageSessions: {},
    sizeImageBusySku: '',
    sizeImageAccessName: '',
    sizeImageAccessEnabled: false,
    sizeImageAccessLoading: true,
    sizeImageAccessTimer: 0,
    cloudBackupRunning: false,
    cloudBackupQueued: false,
    cloudBackupStatus: '',
    classificationRules: [],
    packAiEstimatingKeys: new Set(),
    packAiFailedAt: {},
    logs: loadLogs(),
    logSyncDedup: {},
    insights: loadInsights(),
    insightCloudStatus: '',
    insightCloudReport: '',
    insightReadiness: null,
    maintainedCleaningRules: [],
    maintainedCleaningRulesLoaded: false,
    loadingTips: DEFAULT_LOADING_TIPS.slice(),
    loadingTipsLoaded: false,
    loadingTipText: '',
    loadingTipSeed: '',
  };
  state.expanded = firstTutorial;

  if (isWestmonthLoginPage()) {
    autoClickWestmonthLogin();
    return;
  }

  injectStyle();
  ensurePanel();
  document.addEventListener('paste', handleSizeImageHoverPaste, true);
  ensureLauncher();
  renderShell(L.noDrawer);
  refreshLoadingTips(false);
  scheduleSizeImageAccessRefresh(300);
  window.addEventListener('resize', () => positionLauncher(document.getElementById(LAUNCHER_ID)));
  startDrawerWatcher();
  startUploadQueueSync();
  handleDrawerState();
  scheduleProjectListPrefetch();
  injectDetailImageDownloadButtons();
  if (isUploadWorkerPage()) {
    window.setTimeout(() => processUploadQueue(), 1200);
  }

  function startDrawerWatcher() {
    let timer = 0;
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        handleDrawerState();
        observeManualTabRead();
        injectDetailImageDownloadButtons();
        scheduleProjectListPrefetch();
        positionLauncher(document.getElementById(LAUNCHER_ID));
      }, 120);
    }).observe(document.body, { childList: true, subtree: true });
  }

  function scheduleProjectListPrefetch() {
    if (!state.settings.collectionEnabled || !/\/projectManagementChemicalNew/.test(location.pathname)) return;
    window.clearTimeout(state.projectListPrefetchTimer);
    state.projectListPrefetchTimer = window.setTimeout(prefetchProjectAllListData, 360);
  }

  function prefetchProjectAllListData() {
    state.projectListPrefetchTimer = 0;
    if (!state.settings.collectionEnabled || getActiveProjectWorkflowTabText() !== '\u5168\u90e8') return;
    const rows = collectProjectAllListRows();
    if (!rows.length) return;
    const signature = JSON.stringify(rows);
    if (signature === state.projectListPrefetchSignature) return;
    state.projectListPrefetchSignature = signature;
    let changedCount = 0;
    rows.forEach((row) => {
      const previous = normalizeData(loadData(row.sku) || { sku: row.sku });
      const benchmarkImageUrl = stripOssResizeParams(row.benchmarkImageUrl || '');
      const productListImageUrl = stripOssResizeParams(row.productListImageUrl || '');
      const preserveEffectImage = previous.skuImageSource === 'effectImage' && Boolean(previous.skuImageUrl || previous.skuImageFallbackUrl);
      const useProductListAsSkuImage = row.projectStatus === '\u5df2\u5b8c\u6210' && Boolean(productListImageUrl || row.productListImageUrl) && !preserveEffectImage;
      const candidate = normalizeData({
        ...previous,
        sku: row.sku,
        brand: row.brand || previous.brand || '',
        name: row.name || previous.name || '',
        projectRowId: row.rowId || previous.projectRowId || '',
        developerName: row.developerName || previous.developerName || '',
        developerText: row.developerText || previous.developerText || '',
        benchmarkImageUrl: benchmarkImageUrl || previous.benchmarkImageUrl || '',
        benchmarkImageFallbackUrl: row.benchmarkImageUrl || previous.benchmarkImageFallbackUrl || benchmarkImageUrl || '',
        referenceUrl: row.referenceUrl || previous.referenceUrl || '',
        developmentAdvice: row.developmentAdvice || previous.developmentAdvice || '',
        artPriority: row.artPriority || previous.artPriority || '',
        projectStatus: row.projectStatus || previous.projectStatus || '',
        designType: row.designType || previous.designType || '',
        specificationText: row.specificationText || previous.specificationText || '',
        productListImageUrl: productListImageUrl || previous.productListImageUrl || '',
        productListImageFallbackUrl: row.productListImageUrl || previous.productListImageFallbackUrl || productListImageUrl || '',
        designAssignedAt: row.designAssignedAt || previous.designAssignedAt || '',
        projectCreatedAt: row.projectCreatedAt || previous.projectCreatedAt || '',
        departmentName: row.departmentName || previous.departmentName || '',
        projectOwnerName: row.projectOwnerName || previous.projectOwnerName || '',
        promotionStatus: row.promotionStatus || previous.promotionStatus || '',
        listingStatus: row.listingStatus || previous.listingStatus || '',
        bomStatus: row.bomStatus || previous.bomStatus || '',
        requiresPlanStock: row.requiresPlanStock || previous.requiresPlanStock || '',
        bomAuditStatus: row.bomAuditStatus || previous.bomAuditStatus || '',
        plmCategory: row.plmCategory || previous.plmCategory || '',
        skuImageUrl: useProductListAsSkuImage ? (productListImageUrl || row.productListImageUrl) : (previous.skuImageUrl || ''),
        skuImageFallbackUrl: useProductListAsSkuImage ? (row.productListImageUrl || productListImageUrl) : (previous.skuImageFallbackUrl || ''),
        skuImageSource: useProductListAsSkuImage ? 'productListImage' : (previous.skuImageSource || ''),
        listPrefetchSource: 'project-all',
      });
      if (!hasMeaningfulDataChange(previous, candidate)) return;
      const saved = normalizeData({
        ...candidate,
        listPrefetchedAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString(),
        updatedAtMs: Date.now(),
      });
      saveDataDirect(row.sku, saved);
      upsertIndex(saved);
      if (state.data && state.data.sku === row.sku) state.data = saved;
      changedCount += 1;
    });
    if (!changedCount) return;
    queueCloudBackup();
    addLog('info', '\u65b0\u54c1\u5f00\u53d1\u5217\u8868\u57fa\u7840\u4fe1\u606f\u5df2\u9759\u9ed8\u7f13\u5b58', changedCount + '/' + rows.length + '\u4e2a\u7f16\u7801');
    if (state.view === 'home' || state.view === 'detail') renderShell();
  }

  function collectProjectAllListRows() {
    const headerCells = Array.from(document.querySelectorAll('table.vxe-table--header'))
      .map((table) => Array.from(table.querySelectorAll('thead th')))
      .find((cells) => {
        const names = cells.map((cell) => normalizeProjectListHeader(cell.innerText || cell.textContent));
        return names.includes('\u5546\u54c1\u7f16\u7801') && names.includes('\u9879\u76ee\u72b6\u6001') && names.includes('BOM\u72b6\u6001');
      }) || [];
    if (!headerCells.length) return [];
    const headers = headerCells.map((cell) => normalizeProjectListHeader(cell.innerText || cell.textContent));
    const indexOf = (name) => headers.indexOf(name);
    const skuIndex = indexOf('\u5546\u54c1\u7f16\u7801');
    const imageIndex = indexOf('\u5546\u54c1\u56fe\u7247');
    const body = Array.from(document.querySelectorAll('table.vxe-table--body'))
      .find((table) => Array.from(table.querySelectorAll('tbody tr')).some((row) => row.children.length > imageIndex && /SKU\d+/i.test(row.innerText || row.textContent || '')));
    if (!body || skuIndex < 0) return [];
    const textAt = (cells, name) => {
      const index = indexOf(name);
      return index >= 0 && cells[index] ? cleanProjectListCell(cells[index].innerText || cells[index].textContent) : '';
    };
    const imageAt = (cells, name) => {
      const index = indexOf(name);
      const cell = index >= 0 ? cells[index] : null;
      if (!cell) return '';
      const image = cell.querySelector('img');
      const candidates = image ? [
        image.getAttribute('data-src'),
        image.getAttribute('data-original'),
        image.getAttribute('data-url'),
        image.currentSrc,
        image.src,
        image.getAttribute('src'),
      ] : [];
      const link = cell.querySelector('a[href]');
      if (link) candidates.push(link.href || link.getAttribute('href'));
      return candidates.map((value) => String(value || '').trim()).find((value) => value && !/^data:image\//i.test(value)) || '';
    };
    return Array.from(body.querySelectorAll('tbody tr')).map((row) => {
      const cells = Array.from(row.children);
      const skuText = cells[skuIndex] ? compactText(cells[skuIndex].innerText || cells[skuIndex].textContent) : '';
      const sku = ((skuText.match(/SKU\d+/i) || [])[0] || '').toUpperCase();
      const developerText = textAt(cells, '\u5f00\u53d1\u4eba\u5458');
      return {
        sku,
        rowId: row.getAttribute('rowid') || '',
        developerText,
        developerName: (developerText.match(/^[\u4e00-\u9fa5A-Za-z ._-]+?(?=\s+(?:\u5f00\u53d1|\u4e3b\u7ba1|\u7ecf\u7406|\u4e13\u5458)|\s*\||$)/) || [])[0] || '',
        brand: textAt(cells, '\u54c1\u724c'),
        name: textAt(cells, '\u5546\u54c1\u540d\u79f0'),
        benchmarkImageUrl: imageAt(cells, '\u5bf9\u6807\u56fe\u7247'),
        referenceUrl: textAt(cells, '\u5bf9\u6807\u4ea7\u54c1\u94fe\u63a5'),
        developmentAdvice: textAt(cells, '\u5f00\u53d1\u5efa\u8bae'),
        artPriority: textAt(cells, '\u7f8e\u5de5\u5904\u7406\u4f18\u5148\u7ea7'),
        projectStatus: textAt(cells, '\u9879\u76ee\u72b6\u6001'),
        designType: textAt(cells, '\u8bbe\u8ba1\u7c7b\u578b'),
        specificationText: textAt(cells, '\u89c4\u683c\u578b\u53f7'),
        productListImageUrl: imageAt(cells, '\u5546\u54c1\u56fe\u7247'),
        designAssignedAt: textAt(cells, '\u8bbe\u8ba1\u5206\u914d\u65f6\u95f4'),
        projectCreatedAt: textAt(cells, '\u521b\u5efa\u65f6\u95f4'),
        departmentName: textAt(cells, '\u6240\u5728\u90e8\u95e8'),
        projectOwnerName: textAt(cells, '\u7528\u6237\u540d\u79f0'),
        promotionStatus: textAt(cells, '\u63a8\u5e7f\u72b6\u6001'),
        listingStatus: textAt(cells, '\u4e0a\u67b6\u72b6\u6001'),
        bomStatus: textAt(cells, 'BOM\u72b6\u6001'),
        requiresPlanStock: textAt(cells, '\u662f\u5426\u8981\u6c42\u8ba1\u5212\u5907\u8d27'),
        bomAuditStatus: textAt(cells, '\u5ba1\u6838Bom\u72b6\u6001'),
        plmCategory: textAt(cells, '\u54c1\u7c7b'),
      };
    }).filter((row) => row.sku && row.rowId);
  }

  function normalizeProjectListHeader(value) {
    return compactText(value).replace(/^\*\s*/, '').replace(/[\ue000-\uf8ff]/g, '').trim();
  }

  function cleanProjectListCell(value) {
    const text = compactText(value);
    return text === '--' ? '' : text;
  }

  function isWestmonthLoginPage() {
    return /auth\.westmonth\.com\/auth\/login/.test(location.href);
  }

  function autoClickWestmonthLogin() {
    const tryClick = () => {
      const inputs = Array.from(document.querySelectorAll('input')).filter(isVisibleElement);
      const account = inputs.find((input) => /工号|手机号|邮箱|账号|用户名/i.test(input.placeholder || '') || input.type === 'text');
      const password = inputs.find((input) => input.type === 'password' || /密码/i.test(input.placeholder || ''));
      if (!account || !password || !account.value || !password.value) return false;
      const button = findWestmonthLoginButton();
      if (!button || !isActionButtonReady(button)) return false;
      button.click();
      return true;
    };
    if (tryClick()) return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (tryClick() || Date.now() - startedAt > 15000) window.clearInterval(timer);
    }, 500);
  }

  function findWestmonthLoginButton() {
    return Array.from(document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]'))
      .filter(isVisibleElement)
      .find((el) => {
        const text = compactText(el.innerText || el.textContent || el.value).replace(/\s+/g, '');
        return text === '\u767b\u5f55' || /^log\s*in$/i.test(text);
      }) || null;
  }

  function startUploadQueueSync() {
    const refresh = () => {
      state.uploadQueue = loadUploadQueue();
      state.uploadHistory = loadUploadHistory();
      state.uploadRunning = loadUploadWorkerRunning();
      if (state.view === 'upload' || state.uploadExpanded) renderShell();
    };
    if (typeof GM_addValueChangeListener === 'function') {
      GM_addValueChangeListener(UPLOAD_QUEUE_KEY, (_name, _oldValue, newValue, remote) => {
        if (!remote && isUploadWorkerPage()) return;
        state.uploadQueue = Array.isArray(newValue) ? newValue : loadUploadQueue();
        state.uploadHistory = loadUploadHistory();
        state.uploadRunning = loadUploadWorkerRunning();
        if (state.view === 'upload' || state.uploadExpanded) renderShell();
      });
      GM_addValueChangeListener(UPLOAD_HISTORY_KEY, () => refresh());
      GM_addValueChangeListener(UPLOAD_WORKER_KEY, () => refresh());
    }
    window.addEventListener('storage', (event) => {
      if (event.key === UPLOAD_QUEUE_KEY || event.key === UPLOAD_HISTORY_KEY || event.key === UPLOAD_WORKER_KEY) refresh();
    });
    window.setInterval(refresh, 5000);
  }

  function handleDrawerState() {
    const lockedSku = state.openingProjectDetailSku || '';
    const drawer = getProjectDrawer();
    if (!drawer) {
      scheduleDrawerClosedCollapse();
      return;
    }

    const text = getVisibleText(drawer);
    const sku = findSku(text);
    if (sku && state.selectedSku && sku !== state.selectedSku) {
      state.copywritingMode = false;
      state.copywritingError = '';
      state.copywritingStatus = '';
    }
    if (lockedSku && sku && sku !== lockedSku) return;
    if (lockedSku && !sku && state.openingProjectDetail) return;
    if (state.userCollapsedPanel && state.manuallyCollapsedForSku && state.manuallyCollapsedForSku === (sku || state.sku)) return;
    const shouldAdoptProgrammaticDetail = sku && state.openingProjectDetailSku && sku === state.openingProjectDetailSku;
    if (!shouldAdoptProgrammaticDetail && state.view === 'sizeImage') {
      state.drawer = drawer;
      state.sku = sku || state.sku || '';
      return;
    }
    if (!shouldAdoptProgrammaticDetail && (state.view === 'about' || state.view === 'upload')) {
      state.drawer = drawer;
      state.sku = sku || state.sku || '';
      if (sku) state.selectedSku = sku;
      return;
    }
    const changed = drawer !== state.drawer || (sku && sku !== state.sku);
    if (state.scanRunning && drawer === state.drawer) {
      if (sku && sku !== state.sku) {
        state.sku = sku;
        state.scanTargetSku = sku;
        state.scanData = normalizeData(loadData(sku) || {
          sku,
          name: cleanName((text.match(/\u5546\u54c1\u540d\u79f0[:\uff1a]\s*([^\n]+)/) || [])[1] || ''),
        });
        state.scanAttempts = 0;
        state.seenMaterial = false;
        state.seenProduct = false;
        state.seenDesign = false;
        state.scanTabCounts = {};
      }
      return;
    }
    if (!changed && state.manuallyCollapsedForSku && state.manuallyCollapsedForSku === (sku || state.sku)) return;
    if (!changed) return;
    state.manuallyCollapsedForSku = '';

    const cached = sku ? loadData(sku) : null;
    if (cached) {
      state.drawer = drawer;
      state.sku = sku || '';
      state.data = normalizeData(cached);
      const projectStatus = extractProjectStatus(text);
      if (projectStatus && projectStatus !== state.data.projectStatus) {
        state.data = normalizeData({ ...state.data, projectStatus });
        saveData(sku, state.data);
      }
      state.selectedSku = sku;
      state.view = 'detail';
      resetExcelState();
      expandPanel();
      upsertIndex(state.data);
      stopScan();
      if (!shouldSkipLedgerDrawer(drawer)) {
        upsertDailyLedgerFromData(state.data, { status: '待定稿', stage: '待定稿', note: '打开详情自动记录', requireCurrentMonth: true });
      }
      renderShell();
      return;
    }

    state.drawer = drawer;
    state.sku = sku || '';
    state.data = sku ? normalizeData({ sku, name: cleanName((text.match(/\u5546\u54c1\u540d\u79f0[:\uff1a]\s*([^\n]+)/) || [])[1] || ''), projectStatus: extractProjectStatus(text) }) : null;
    state.selectedSku = sku || '';
    state.view = 'detail';
    resetExcelState();
    expandPanel();
    if (state.settings.collectionEnabled) {
      resetRound(AUTO_SCAN_ATTEMPTS);
      state.scanTargetSku = sku || '';
      startScan();
      return;
    }
    renderShell();
  }

  function scheduleDrawerClosedCollapse() {
    const hadDrawer = Boolean(state.drawer || state.sku);
    stopScan();
    stopMaterialWatch();
    stopManualTabRead();
    state.drawer = null;
    state.sku = '';
    state.observedDrawer = null;
    state.observedSku = '';
    state.observedTab = '';
    if (hadDrawer) collapsePanel(true);
  }

  function resetRound(maxAttempts) {
    stopScan();
    state.scanAttempts = 0;
    state.maxAttempts = maxAttempts;
    state.scanRunning = false;
    state.scanTargetSku = '';
    state.scanData = null;
    state.seenMaterial = false;
    state.seenProduct = false;
    state.seenDesign = false;
    state.scanTabCounts = {};
    state.nextTabTarget = L.materialTab;
    state.lastTabClickAt = 0;
  }

  function startScan() {
    if (!state.settings.collectionEnabled) return;
    const drawer = getProjectDrawer();
    if (!drawer) {
      showToast('\u8bf7\u5148\u6253\u5f00\u9879\u76ee\u8be6\u60c5');
      return;
    }
    stopScan();
    const drawerSku = findSku(getVisibleText(drawer));
    const targetSku = state.scanTargetSku || drawerSku || state.sku || '';
    if (targetSku) {
      state.scanTargetSku = targetSku;
      if (!state.scanData || state.scanData.sku !== targetSku) {
        const activeData = state.data && state.data.sku === targetSku ? state.data : null;
        state.scanData = normalizeData(activeData || loadData(targetSku) || { sku: targetSku });
      }
    }
    lockLoadingTip(targetSku || state.selectedSku || '');
    state.scanRunning = true;
    if (!isLoadingTipVisible()) renderShell(L.scanning);
    scanOnce();
  }

  async function refreshSelectedData() {
    if (!state.settings.collectionEnabled) {
      showToast('数据采集已关闭');
      return;
    }
    const targetSku = (state.data && state.data.sku) || state.selectedSku || '';
    if (!targetSku) {
      showToast(L.excelNeedData);
      return;
    }

    state.view = 'detail';
    stopMaterialWatch();
    stopScan();
    expandPanel();

    let drawer = getProjectDrawer();
    const drawerText = drawer ? getVisibleText(drawer) : '';
    if (!drawer || !drawerText.includes(targetSku)) {
      renderShell('\u6b63\u5728\u6253\u5f00\u6b63\u786e\u7f16\u7801\u8be6\u60c5...');
      await openSelectedProjectDetail();
      drawer = await waitFor(() => getProjectDrawerForSku(targetSku), 5000, 150);
      if (!drawer) {
        showToast(L.openDetailFailed);
        renderShell();
        return;
      }
    }

    state.drawer = drawer;
    state.sku = targetSku;
    state.selectedSku = targetSku;
    if (state.thumbHydrateFailedAt) delete state.thumbHydrateFailedAt[targetSku];
    state.thumbHydratedSkus.delete(targetSku);
    state.data = createRefreshSeedData(targetSku);
    state.refreshingThumbSku = targetSku;
    resetExcelState();
    resetRound(REFRESH_SCAN_ATTEMPTS);
    state.scanTargetSku = targetSku;
    renderShell(L.scanning);
    await wait(900);
    await prepareDrawerForRefresh(drawer);
    startScan();
  }

  function createRefreshSeedData(sku) {
    const cached = normalizeData(loadData(sku) || {});
    const preservedImageSource = /^(?:effectImage|productListImage)$/.test(cached.skuImageSource || '') ? cached.skuImageSource : '';
    return normalizeData({
      sku,
      name: cached.name || '',
      brand: cached.brand || '',
      projectRowId: cached.projectRowId || '',
      projectId: cached.projectId || '',
      copywriting: cached.copywriting || null,
      tailSealLengthValue: cached.tailSealLengthValue || '',
      productListImageUrl: cached.productListImageUrl || '',
      productListImageFallbackUrl: cached.productListImageFallbackUrl || '',
      skuImageUrl: preservedImageSource ? (cached.skuImageUrl || '') : '',
      skuImageFallbackUrl: preservedImageSource ? (cached.skuImageFallbackUrl || '') : '',
      skuImageSource: preservedImageSource,
    });
  }

  async function prepareDrawerForRefresh(drawer) {
    const productTab = drawer ? findTabButton(drawer, L.productTab) : null;
    if (productTab && !isActiveTab(productTab)) {
      state.ignoreOutsideClickUntil = Date.now() + 1200;
      productTab.click();
    }
    await waitForProductGrossWeight(drawer, 3500);
    await wait(250);
  }

  async function waitForProductGrossWeight(drawer, timeout) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      if (normalizeWeight(getFormValueByLabel('\u6bdb\u91cd', drawer))) return true;
      await wait(150);
    }
    return false;
  }

  function stopScan() {
    if (state.scanTimer) {
      window.clearTimeout(state.scanTimer);
      state.scanTimer = 0;
    }
    state.scanRunning = false;
  }

  function stopManualTabRead() {
    if (state.manualCollectTimer) {
      window.clearTimeout(state.manualCollectTimer);
      state.manualCollectTimer = 0;
    }
  }

  function observeManualTabRead() {
    const drawer = getProjectDrawer();
    if (!drawer || state.scanRunning || !state.settings.collectionEnabled) return;
    const sku = findSku(getVisibleText(drawer));
    const tab = getActiveTabText(drawer);
    if (!sku || !tab) return;
    if (drawer !== state.observedDrawer || sku !== state.observedSku) {
      state.observedDrawer = drawer;
      state.observedSku = sku;
      state.observedTab = tab;
      return;
    }
    if (tab === state.observedTab) return;
    state.observedTab = tab;
    stopManualTabRead();
    state.manualCollectTimer = window.setTimeout(() => readCurrentManualTab(drawer, sku, tab), 420);
  }

  function readCurrentManualTab(drawer, sku, tab) {
    state.manualCollectTimer = 0;
    if (!state.settings.collectionEnabled || state.scanRunning || drawer !== getProjectDrawerForSku(sku) || getActiveTabText(drawer) !== tab) return;
    const next = extractData(drawer, { forceSkuImage: tab === '\u8bbe\u8ba1\u8d44\u6599' });
    if (!next.sku || next.sku !== sku) return;
    const merged = mergeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }), next);
    const previous = normalizeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }));
    if (!hasMeaningfulDataChange(previous, merged)) return;
    saveData(sku, merged);
    if (state.selectedSku === sku) renderShell();
  }

  function startMaterialWatch() {
    stopMaterialWatch();
    state.materialWatchAttempts = 0;
    checkMaterialOnce();
  }

  function stopMaterialWatch() {
    if (state.materialWatchTimer) {
      window.clearTimeout(state.materialWatchTimer);
      state.materialWatchTimer = 0;
    }
  }

  function checkMaterialOnce() {
    const drawer = getProjectDrawer();
    const targetSku = state.scanTargetSku || state.sku || (state.data && state.data.sku) || '';
    const trackedData = state.scanData && state.scanData.sku === targetSku
      ? state.scanData
      : normalizeData(loadData(targetSku) || {});
    if (!drawer || !targetSku || !trackedData.sku) {
      stopMaterialWatch();
      return;
    }

    state.materialWatchAttempts += 1;
    const text = getVisibleText(drawer);
    const activeTabText = getActiveTabText(drawer);
    const onMaterial = activeTabText === L.materialTab || /\u7269\u6599\u7f16\u7801.*\u7269\u6599\u540d\u79f0.*\u89c4\u683c\u578b\u53f7/.test(text);

    if (!onMaterial) {
      const tab = findTabButton(drawer, L.materialTab);
      if (tab && !isActiveTab(tab)) {
        state.ignoreOutsideClickUntil = Date.now() + 1200;
        tab.click();
      }
    } else {
      const packaging = extractPackaging(drawer);
      if (hasPackagingChanged(trackedData, packaging)) {
        const packageNums = packaging.packageNums || trackedData.packageNums || null;
        const hasInnerCard = hasInnerCardMark(packaging) || hasInnerCardMark(trackedData);
        const productNums = productNumsFromPackage(packageNums, hasInnerCard);
        const updatedData = normalizeData({
          ...trackedData,
          packageSizeText: packaging.packageSizeText || trackedData.packageSizeText,
          packageSizeLabel: packaging.packageSizeLabel || trackedData.packageSizeLabel,
          packageCode: packaging.packageCode || trackedData.packageCode,
          printSizeText: packaging.printSizeText || trackedData.printSizeText,
          printSizeLabel: packaging.printSizeLabel || trackedData.printSizeLabel,
          printCode: packaging.printCode || trackedData.printCode,
          packageNums,
          productNums,
          packageSource: packaging.packageSizeText ? L.sourceMaterial : trackedData.packageSource,
          hasInnerCard,
          netContent: packaging.netContent || trackedData.netContent,
          updatedAt: new Date().toLocaleString(),
          updatedAtMs: Date.now(),
        });
        if (state.scanData && state.scanData.sku === targetSku) state.scanData = updatedData;
        saveData(targetSku, updatedData);
        renderShell('\u7269\u6599\u6e05\u5355\u5c3a\u5bf8\u5df2\u66f4\u65b0');
        stopMaterialWatch();
        return;
      }
    }

    if (state.materialWatchAttempts >= MATERIAL_WATCH_ATTEMPTS) {
      stopMaterialWatch();
      renderShell(L.cached);
      return;
    }
    state.materialWatchTimer = window.setTimeout(checkMaterialOnce, SCAN_INTERVAL_MS);
  }

  function hasPackagingChanged(data, packaging) {
    if (!packaging) return false;
    if (packaging.packageSizeText && packaging.packageSizeText !== data.packageSizeText) return true;
    if (packaging.packageSizeLabel && packaging.packageSizeLabel !== data.packageSizeLabel) return true;
    if (hasInnerCardMark(packaging) !== hasInnerCardMark(data)) return true;
    if (packaging.printSizeText && packaging.printSizeText !== data.printSizeText) return true;
    if (packaging.printSizeLabel && packaging.printSizeLabel !== data.printSizeLabel) return true;
    return false;
  }

  function scanOnce() {
    const drawer = getProjectDrawer();
    if (!drawer) {
      handleDrawerState();
      return;
    }

    state.scanAttempts += 1;
    const next = extractData(drawer);
    if (state.scanTargetSku && next.sku && next.sku !== state.scanTargetSku) {
      stopScan();
      state.sku = next.sku;
      state.scanTargetSku = next.sku;
      state.scanData = normalizeData(loadData(next.sku) || next);
      renderShell('\u62bd\u5c49\u7f16\u7801\u5df2\u5207\u6362\uff0c\u6b63\u5728\u8bfb\u53d6\u5bf9\u5e94\u4ea7\u54c1...');
      startScan();
      return;
    }
    state.seenMaterial = state.seenMaterial || next.seenMaterial;
    state.seenProduct = state.seenProduct || next.seenProduct;
    state.seenDesign = state.seenDesign || next.seenDesign;
    markCurrentScanTabRead(drawer, next);

    const targetSku = next.sku || state.scanTargetSku || state.sku || '';
    if (targetSku) state.sku = targetSku;
    const previous = state.scanData && state.scanData.sku === targetSku
      ? state.scanData
      : (loadData(targetSku) || { sku: targetSku });
    state.scanData = mergeData(previous, next);
    if (state.selectedSku === targetSku) state.data = state.scanData;

    if (isRoundComplete(state.scanData) || state.scanAttempts >= state.maxAttempts) {
      finishRound();
      return;
    }

    clickUsefulTab(drawer);
    state.scanTimer = window.setTimeout(scanOnce, SCAN_INTERVAL_MS);
  }

  async function finishRound() {
    stopScan();
    const completedData = state.scanData;
    if (completedData && completedData.sku) {
      saveData(completedData.sku, completedData);
      if (!shouldSkipLedgerDrawer(getProjectDrawerForSku(completedData.sku) || getProjectDrawer())) {
        upsertDailyLedgerFromData(completedData, { status: '待定稿', stage: '待定稿', note: '打开详情自动记录', requireCurrentMonth: true });
      }
    }
    const shouldRefreshThumb = state.refreshingThumbSku && completedData && completedData.sku === state.refreshingThumbSku;
    if (shouldRefreshThumb) state.refreshingThumbSku = '';
    state.scanTargetSku = '';
    state.scanData = null;
    renderShell(L.scanDone);
    if (completedData && completedData.sku) {
      scheduleProductThumbHydration(completedData, shouldRefreshThumb ? { force: true, refreshImage: true } : { force: true });
    }
  }

  async function diagnoseMissingDataBeforeSave(data) {
    const missing = getMissingFieldsForData(data);
    if (!missing.length || state.diagnosticRunning) return data;
    const issueMeta = getDataQualityIssueMeta(data, missing);
    if (issueMeta.kind === '\u53ef\u80fd PLM \u7a7a\u503c') return data;

    const drawer = getProjectDrawerForSku(data.sku) || getProjectDrawer();
    if (!drawer) {
      addLog('warn', '\u6570\u636e\u7f3a\u5931\u8bca\u65ad\u8df3\u8fc7', data.sku + ' \u672a\u627e\u5230\u5bf9\u5e94\u62bd\u5c49');
      return attachMissingDiagnostic(data, {
        status: '\u672a\u6267\u884c',
        reason: '\u672a\u627e\u5230\u5bf9\u5e94\u62bd\u5c49',
        beforeMissing: missing,
        afterMissing: missing,
        fixed: [],
        tabs: [],
      });
    }

    const tabs = getDiagnosticTabsForMissing(missing);
    if (!tabs.length) {
      return attachMissingDiagnostic(data, {
        status: '\u672a\u6267\u884c',
        reason: '\u672a\u627e\u5230\u9700\u4e8c\u6b21\u8bfb\u53d6\u7684\u9875\u7b7e',
        beforeMissing: missing,
        afterMissing: missing,
        fixed: [],
        tabs: [],
      });
    }
    state.diagnosticRunning = true;
    addLog('info', '\u5f00\u59cb\u4e8c\u6b21\u8bfb\u53d6\u7f3a\u5931\u6570\u636e', data.sku + ' \u7f3a\uff1a' + missing.join('\u3001') + ' / ' + issueMeta.kind);
    let merged = data;
    const startedAt = Date.now();
    const attempts = [];
    try {
      for (const tabName of tabs) {
        const tab = findTabButton(drawer, tabName);
        if (tab && !isActiveTab(tab)) {
          state.ignoreOutsideClickUntil = Date.now() + 1200;
          tab.click();
        }
        const beforeTabMissing = getMissingFieldsForData(merged);
        let afterTabMissing = beforeTabMissing;
        let tabAttempts = 0;
        for (let index = 0; index < 3; index += 1) {
          tabAttempts += 1;
          await wait((tabName === '\u8bbe\u8ba1\u8d44\u6599' ? 520 : 380) + (index * 180));
          const live = extractData(drawer);
          merged = mergeData(merged, live);
          afterTabMissing = getMissingFieldsForData(merged);
          if (afterTabMissing.length < beforeTabMissing.length || !afterTabMissing.some((field) => beforeTabMissing.includes(field))) break;
        }
        attempts.push({
          tab: tabName,
          count: tabAttempts,
          beforeMissing: beforeTabMissing,
          afterMissing: afterTabMissing,
        });
      }
      const afterMissing = getMissingFieldsForData(merged);
      const fixed = missing.filter((field) => !afterMissing.includes(field));
      if (fixed.length) {
        addLog('success', '\u4e8c\u6b21\u8bfb\u53d6\u5df2\u8865\u5230\u6570\u636e', data.sku + ' \u8865\u5230\uff1a' + fixed.join('\u3001'));
      } else {
        addLog('warn', '\u4e8c\u6b21\u8bfb\u53d6\u540e\u4ecd\u7f3a\u6570\u636e', data.sku + ' \u4ecd\u7f3a\uff1a' + afterMissing.join('\u3001'));
      }
      return attachMissingDiagnostic(merged, {
        status: fixed.length ? '\u90e8\u5206\u8865\u5230' : '\u4ecd\u7f3a',
        reason: fixed.length ? '\u4e8c\u6b21\u8bfb\u53d6\u6210\u529f\u8865\u5230\u90e8\u5206\u5b57\u6bb5' : '\u4e8c\u6b21\u8bfb\u53d6\u540e\u4ecd\u7f3a\u5b57\u6bb5',
        beforeMissing: missing,
        afterMissing,
        fixed,
        tabs,
        attempts,
        elapsedMs: Date.now() - startedAt,
      });
    } catch (error) {
      addLog('warn', '\u4e8c\u6b21\u8bfb\u53d6\u7f3a\u5931\u6570\u636e\u5931\u8d25', data.sku + ' ' + formatErrorMessage(error));
      return attachMissingDiagnostic(data, {
        status: '\u5931\u8d25',
        reason: formatErrorMessage(error),
        beforeMissing: missing,
        afterMissing: getMissingFieldsForData(data),
        fixed: [],
        tabs,
        attempts,
        elapsedMs: Date.now() - startedAt,
      });
    } finally {
      state.diagnosticRunning = false;
    }
  }

  function attachMissingDiagnostic(data, diagnostic) {
    return normalizeData({
      ...(data || {}),
      lastMissingDiagnostic: {
        status: String(diagnostic && diagnostic.status || '').slice(0, 40),
        reason: String(diagnostic && diagnostic.reason || '').slice(0, 160),
        beforeMissing: Array.isArray(diagnostic && diagnostic.beforeMissing) ? diagnostic.beforeMissing.slice(0, 20) : [],
        afterMissing: Array.isArray(diagnostic && diagnostic.afterMissing) ? diagnostic.afterMissing.slice(0, 20) : [],
        fixed: Array.isArray(diagnostic && diagnostic.fixed) ? diagnostic.fixed.slice(0, 20) : [],
        tabs: Array.isArray(diagnostic && diagnostic.tabs) ? diagnostic.tabs.slice(0, 8) : [],
        attempts: sanitizeDiagnosticAttempts(diagnostic && diagnostic.attempts),
        elapsedMs: Number(diagnostic && diagnostic.elapsedMs || 0) || 0,
        at: new Date().toLocaleString(),
      },
    });
  }

  function sanitizeDiagnosticAttempts(attempts) {
    return Array.isArray(attempts) ? attempts.slice(0, 8).map((item) => ({
      tab: String(item && item.tab || '').slice(0, 40),
      count: Number(item && item.count || 0) || 0,
      beforeMissing: Array.isArray(item && item.beforeMissing) ? item.beforeMissing.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 20) : [],
      afterMissing: Array.isArray(item && item.afterMissing) ? item.afterMissing.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 20) : [],
    })).filter((item) => item.tab) : [];
  }

  function getDiagnosticTabsForMissing(missing) {
    const tabs = [];
    const needMaterial = missing.some((field) => ['\u5305\u88c5\u5c3a\u5bf8', '\u5370\u5237\u5c3a\u5bf8', '\u51c0\u542b\u91cf'].includes(field));
    const needProduct = missing.some((field) => ['\u4ea7\u54c1\u5c3a\u5bf8', '\u6bdb\u91cd'].includes(field));
    const needDesign = missing.some((field) => ['SKU\u56fe'].includes(field));
    if (needMaterial) tabs.push(L.materialTab);
    if (needProduct) tabs.push(L.productTab);
    if (needDesign) tabs.push('\u8bbe\u8ba1\u8d44\u6599');
    return tabs;
  }

  function isRoundComplete(data) {
    return Boolean(data && data.sku && data.name && state.seenMaterial && state.seenProduct && (!requiresSkuImage(data) || state.seenDesign));
  }

  function requiresSkuImage(data) {
    return Boolean(data && data.projectStatus === '\u5df2\u5b8c\u6210');
  }

  function clickUsefulTab(drawer) {
    const now = Date.now();
    if (now - state.lastTabClickAt < TAB_CLICK_COOLDOWN_MS) return;

    const target = getNextScanTabTarget(drawer);

    if (!target) return;
    const tab = findTabButton(drawer, target);
    if (!tab || isActiveTab(tab)) return;
    state.lastTabClickAt = now;
    state.ignoreOutsideClickUntil = Date.now() + 1200;
    tab.click();
  }

  function markCurrentScanTabRead(drawer, data) {
    const activeText = getActiveTabText(drawer);
    const tabKey = activeText === L.materialTab
      ? 'material'
      : (activeText === L.productTab ? 'product' : (activeText === '\u8bbe\u8ba1\u8d44\u6599' ? 'design' : ''));
    if (tabKey === 'material' && !(data && data.seenMaterial)) return;
    if (tabKey === 'product' && !(data && data.seenProduct)) return;
    if (tabKey === 'design' && !(data && data.seenDesign)) return;
    if (!tabKey) return;
    state.scanTabCounts[tabKey] = (state.scanTabCounts[tabKey] || 0) + 1;
  }

  function getNextScanTabTarget(drawer) {
    const activeText = getActiveTabText(drawer);
    const minReads = 2;
    if (!state.seenMaterial) return activeText === L.materialTab && (state.scanTabCounts.material || 0) < minReads ? '' : L.materialTab;
    if ((state.scanTabCounts.material || 0) < minReads && activeText === L.materialTab) return '';
    if (!state.seenProduct) return activeText === L.productTab && (state.scanTabCounts.product || 0) < minReads ? '' : L.productTab;
    if ((state.scanTabCounts.product || 0) < minReads && activeText === L.productTab) return '';
    if (!requiresSkuImage(state.scanData)) return '';
    if (!state.seenDesign) return activeText === '\u8bbe\u8ba1\u8d44\u6599' && (state.scanTabCounts.design || 0) < minReads ? '' : '\u8bbe\u8ba1\u8d44\u6599';
    if ((state.scanTabCounts.design || 0) < minReads && activeText === '\u8bbe\u8ba1\u8d44\u6599') return '';
    return '';
  }

  function getProjectDrawer() {
    if (state.openingProjectDetailSku) {
      const locked = getProjectDrawerForSku(state.openingProjectDetailSku);
      if (locked) return locked;
    }
    const drawers = Array.from(document.querySelectorAll('.ant-drawer-open'))
      .filter(isVisibleElement)
      .filter((drawer) => {
        const text = getVisibleText(drawer);
        if (/\u67e5\u770b\u5546\u54c1/.test(text)) return false;
        return /\u67e5\u770b\u9879\u76ee\u8be6\u60c5/.test(text);
      });
    return drawers[drawers.length - 1] || null;
  }

  function extractData(drawer, options) {
    const opts = options || {};
    const text = getVisibleText(drawer);
    const activeTabText = getActiveTabText(drawer);
    const seenMaterial = activeTabText === L.materialTab || /\u7269\u6599\u7f16\u7801.*\u7269\u6599\u540d\u79f0.*\u89c4\u683c\u578b\u53f7/.test(text);
    const seenProduct = activeTabText === L.productTab || /\u89c4\u683c\u4fe1\u606f[\s\S]{0,300}\u6bdb\u91cd/.test(text);
    const seenDesign = activeTabText === '\u8bbe\u8ba1\u8d44\u6599' || /\u6548\u679c\u56fe\u4fe1\u606f|\bSKU[\s(_-]*\d+.*\.(jpg|jpeg|png|webp)\b/i.test(text);
    const projectStatus = extractProjectStatus(text);
    const packaging = seenMaterial ? extractPackaging(drawer) : emptyPackaging();
    const outer = extractOuterPackage(drawer);
    const food = seenMaterial ? extractFoodSemiFinished(drawer) : emptyFoodSemiFinished();
    const imageInfo = seenDesign && (projectStatus === '\u5df2\u5b8c\u6210' || opts.forceSkuImage) ? findDesignImageInfo(drawer) : { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    const tubeFields = extractTubeFields(drawer);
    const tubeSpec = findTubeSizeSpec([tubeFields.text, packaging.printRawText, packaging.printSizeText, packaging.printSizeLabel, text].filter(Boolean).join('\n'), tubeFields);
    const isTubePrint = Boolean(tubeSpec);
    const packageNums = packaging.packageNums || outer.packageNums;
    const hasInnerCard = hasInnerCardMark(packaging);
    const productNums = packageNums ? productNumsFromPackage(packageNums, hasInnerCard) : food.productNums;

    return {
      sku: findSku(text),
      name: cleanName((text.match(/\u5546\u54c1\u540d\u79f0[:\uff1a]\s*([^\n]+)/) || [])[1] || ''),
      packageSizeText: packaging.packageSizeText || '',
      packageSizeLabel: packaging.packageSizeLabel || '',
      packageCode: packaging.packageCode || '',
      printSizeText: tubeSpec ? tubeSpec.printSizeText : (packaging.printSizeText || ''),
      printSizeLabel: tubeSpec ? '\u5370\u5237' : (packaging.printSizeLabel || ''),
      printCode: packaging.printCode || '',
      tubeSegmentText: tubeSpec ? tubeSpec.segmentText : '',
      tubeTailSealLengthValue: tubeSpec ? tubeSpec.tailSealText : '',
      tailSealLengthValue: tubeSpec ? tubeSpec.tailSealText : '',
      tubeDiameter: tubeSpec ? tubeSpec.diameter : '',
      tubeBody: tubeSpec ? tubeSpec.body : '',
      tubeSpecKey: tubeSpec ? tubeSpec.key : '',
      isTubePrintMaterial: isTubePrint || packaging.isTubePrintMaterial,
      packageNums,
      productNums,
      packageSource: packaging.packageSizeText || food.productNums || isTubePrint ? L.sourceMaterial : (outer.packageNums ? L.sourceOuter : ''),
      hasInnerCard,
      brand: getProjectField(text, '\u54c1\u724c') || getFormValueByLabel('\u54c1\u724c', drawer),
      designType: getProjectLooseField(text, '\u8bbe\u8ba1\u7c7b\u578b'),
      artPriority: getProjectLooseField(text, '\u7f8e\u5de5\u5904\u7406\u4f18\u5148\u7ea7') || extractArtPriority(text),
      projectStatus,
      referenceUrl: extractReferenceUrl(text),
      designAssignedAt: getProjectLooseField(text, '\u8bbe\u8ba1\u5206\u914d\u65f6\u95f4'),
      developmentAssignedAt: getProjectLooseField(text, '\u5f00\u53d1\u5206\u914d\u65f6\u95f4'),
      netContent: normalizeNetContentValue(getBestNetContent(drawer) || food.netContent || packaging.netContent),
      grossWeight: normalizeWeight(getFormValueByLabel('\u6bdb\u91cd', drawer)),
      skuImageUrl: imageInfo.isSkuDesignImage ? (imageInfo.imageUrl || '') : '',
      skuImageFallbackUrl: imageInfo.isSkuDesignImage ? (imageInfo.imageFallbackUrl || '') : '',
      skuImageSource: imageInfo.isSkuDesignImage ? 'effectImage' : '',
      seenMaterial,
      seenProduct,
      seenDesign,
      updatedAt: new Date().toLocaleString(),
      updatedAtMs: Date.now(),
    };
  }

  function mergeData(previous, next) {
    if (!previous) return normalizeData(next);
    const sameSku = previous.sku && next.sku && previous.sku === next.sku;
    if (!sameSku) return normalizeData(next);

    const merged = { ...previous };
    for (const key of Object.keys(next)) {
      if (isUsefulValue(next[key])) merged[key] = next[key];
    }
    if (next.seenMaterial) {
      const hasTubeSpec = Boolean(next.tubeSegmentText || next.tubeTailSealLengthValue || next.tailSealLengthValue || next.tubeDiameter || next.tubeBody || next.tubeSpecKey || next.isTubePrintMaterial);
      if (hasTubeSpec) {
        ['tubeSegmentText', 'tubeTailSealLengthValue', 'tailSealLengthValue', 'tubeDiameter', 'tubeBody', 'tubeSpecKey'].forEach((key) => {
          if (Object.prototype.hasOwnProperty.call(next, key)) merged[key] = next[key] || '';
        });
        if (Object.prototype.hasOwnProperty.call(next, 'isTubePrintMaterial')) merged.isTubePrintMaterial = Boolean(next.isTubePrintMaterial);
      } else {
        ['tubeSegmentText', 'tubeTailSealLengthValue', 'tailSealLengthValue', 'tubeDiameter', 'tubeBody', 'tubeSpecKey'].forEach((key) => {
          merged[key] = '';
        });
        merged.isTubePrintMaterial = false;
      }
    }
    if (next.seenDesign && (next.skuImageUrl || next.skuImageFallbackUrl)) {
      merged.skuImageUrl = next.skuImageUrl || merged.skuImageUrl || '';
      merged.skuImageFallbackUrl = next.skuImageFallbackUrl || merged.skuImageFallbackUrl || '';
      merged.skuImageSource = next.skuImageSource || merged.skuImageSource || 'effectImage';
    }
    merged.seenMaterial = previous.seenMaterial || next.seenMaterial;
    merged.seenProduct = previous.seenProduct || next.seenProduct;
    merged.seenDesign = previous.seenDesign || next.seenDesign;
    return normalizeData(merged);
  }

  function hasMeaningfulDataChange(previous, next) {
    const ignored = new Set(['updatedAt', 'updatedAtMs', 'lastMissingDiagnostic']);
    const before = {};
    const after = {};
    Object.keys(previous || {}).forEach((key) => {
      if (!ignored.has(key)) before[key] = previous[key];
    });
    Object.keys(next || {}).forEach((key) => {
      if (!ignored.has(key)) after[key] = next[key];
    });
    return JSON.stringify(before) !== JSON.stringify(after);
  }

  function normalizeData(data) {
    const safe = data || {};
    migrateLabelValue(safe, 'packageSizeLabel', 'packageSizeText');
    migrateLabelValue(safe, 'printSizeLabel', 'printSizeText');
    stripKnownLabelPrefix(safe, 'packageSizeLabel', 'packageSizeText');
    stripKnownLabelPrefix(safe, 'printSizeLabel', 'printSizeText');
    const packageNums = Array.isArray(safe.packageNums) ? safe.packageNums : parseDimension(safe.packageSizeText, 3);
    const hasInnerCard = hasInnerCardMark(safe);
    if (packageNums && packageNums.length >= 5 && !/\u591a\u9875/.test(String(safe.packageSizeLabel || ''))) {
      safe.packageSizeLabel = appendChineseRemark(safe.packageSizeLabel, '\u591a\u9875');
    }
    const productNums = packageNums ? productNumsFromPackage(packageNums, hasInnerCard) : (Array.isArray(safe.productNums) ? safe.productNums : null);
    const isTubePrint = isTubePrintData(safe, packageNums);
    const copywriting = normalizeCopywritingRecord(safe.copywriting);
    return {
      ...safe,
      copywriting,
      hasInnerCard,
      isTubePrint,
      isTubePrintMaterial: Boolean(safe.isTubePrintMaterial),
      packageNums,
      productNums,
      packageLength: formatDimensionPart(packageNums, 0),
      packageWidth: formatDimensionPart(packageNums, 1),
      packageHeight: formatDimensionPart(packageNums, 2),
      tubeSegmentText: isTubePrint ? (safe.tubeSegmentText || '') : '',
      tubeTailSealLengthValue: isTubePrint ? (safe.tubeTailSealLengthValue || '') : '',
      tailSealLengthValue: isTubePrint ? (safe.tailSealLengthValue || safe.tubeTailSealLengthValue || '') : '',
      productLength: isTubePrint ? (safe.tailSealLengthValue || safe.tubeTailSealLengthValue || '') : formatDimensionPart(productNums, 0),
      productWidth: formatDimensionPart(productNums, 1),
      productHeight: formatDimensionPart(productNums, 2),
    };
  }

  function hasInnerCardMark(data) {
    if (!data) return false;
    return Boolean(data.hasInnerCard || /\u5185\u5361/.test(String(data.packageSizeLabel || '') + String(data.packageSizeText || '')));
  }

  function migrateLabelValue(data, labelKey, valueKey) {
    if (!data || data[labelKey] || !data[valueKey]) return;
    const text = String(data[valueKey]);
    const index = text.indexOf('\uff1a');
    if (index <= 0) return;
    data[labelKey] = text.slice(0, index);
    data[valueKey] = text.slice(index + 1);
  }

  function stripKnownLabelPrefix(data, labelKey, valueKey) {
    if (!data || !data[labelKey] || !data[valueKey]) return;
    const prefix = data[labelKey] + '\uff1a';
    if (String(data[valueKey]).startsWith(prefix)) {
      data[valueKey] = String(data[valueKey]).slice(prefix.length);
    }
    data[valueKey] = stripGenericDimensionPrefixes(data[valueKey]);
  }

  function stripGenericDimensionPrefixes(value) {
    return String(value || '')
      .split(/\s*[\uff1b;]\s*/)
      .map((item) => item.replace(/^(?:\u5370\u5237|\u6807\u7b7e|\u5370\u5237\u5c3a\u5bf8|\u6807\u7b7e\u5c3a\u5bf8|\u5c3a\u5bf8)[:\uff1a]\s*(?=\d)/, ''))
      .filter(Boolean)
      .join('\uff1b');
  }

  function isUsefulValue(value) {
    if (value === '' || value === undefined || value === null || value === false) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }

  function extractPackaging(root) {
    const rows = getMaterialRows(root);
    const packageRows = rows.filter((row) => /\u5305\u6750/.test(row) && /(\u7eb8\u76d2|\u5370\u5237\u81ea\u7acb\u888b|\u5370\u5237\u888b|\u5305\u88c5\u888b|\u94dd\u7b94\u888b|\u81ea\u5c01\u888b|\u888b\u5b50)/.test(row));
    const printRows = rows.filter((row) => !/(\u8bf4\u660e\u4e66|\u5370\u5237\u81ea\u7acb\u888b|\u5370\u5237\u888b|\u5305\u88c5\u888b|\u94dd\u7b94\u888b|\u81ea\u5c01\u888b|\u888b\u5b50)/.test(row) && ((/\u5305\u6750/.test(row) && /(\u6807\u7b7e|\u5370\u5237\u8f6f\u7ba1|\u5370\u5237\u5c3a\u5bf8|\u5370\u5237\u7ba1|\u5370\u5237\u74f6|\u5370\u5237\u4e73\u6db2\u74f6|\u8f6f\u7ba1)/.test(row)) || (/\u5305\u6750/.test(row) && /\u5370\u5237/.test(row) && hasPrintDimensionText(row)) || (/\u5370\u5237(?:\u74f6|\u7ba1|\u8f6f\u7ba1|\u4e73\u6db2\u74f6)/.test(row) && hasPrintDimensionText(row))));
    const packageRow = packageRows[0] || '';
    const packageDim = extractDimensionString(packageRow);
    const packageNums = parseDimension(packageDim, 3);
    let packageName = getMaterialDisplayName(packageRow, /(\u7eb8\u76d2|\u5370\u5237\u81ea\u7acb\u888b|\u5370\u5237\u888b|\u5305\u88c5\u888b|\u94dd\u7b94\u888b|\u81ea\u5c01\u888b|\u888b\u5b50)/);
    if (packageNums && packageNums.length >= 5 && !/\u591a\u9875/.test(packageName + packageRow)) {
      packageName = appendChineseRemark(packageName, '\u591a\u9875');
    }
    const printItems = printRows.map((row) => {
      const dims = extractNamedDimensionStrings(row);
      if (!dims.length) return '';
      return dims.join('\uff1b');
    }).filter(Boolean);

    return {
      packageSizeText: packageDim,
      packageSizeLabel: packageName || '',
      packageCode: extractMaterialCode(packageRow),
      packageNums,
      hasInnerCard: /\u5185\u5361/.test(packageRow),
      printSizeText: printItems.join('\uff1b'),
      printSizeLabel: getCombinedPrintLabel(printRows),
      printCode: printRows.map(extractMaterialCode).filter(Boolean).join('\uff1b'),
      isTubePrintMaterial: printRows.some(isTubePrintRow),
      printRawText: printRows.join('\uff1b').slice(0, 1000),
      netContent: extractNetContentFromMaterial(packageRow) || extractNetContentFromMaterial(printRows[0] || ''),
    };
  }

  function getProjectField(text, fieldName) {
    const escaped = escapeRegExp(fieldName);
    const stop = /(\u9879\u76ee\u7f16\u7801|\u9700\u6c42\u7f16\u7801|\u5546\u54c1\u540d\u79f0|\u5546\u54c1\u7f16\u7801|\u7f8e\u5de5\u5904\u7406\u4f18\u5148\u7ea7|\u5e73\u53f0|\u4ea7\u54c1\u540d\u79f0|\u5173\u952e\u8bcd|\u8bbe\u8ba1\u7c7b\u578b|\u662f\u5426\u7206\u6b3e|\u662f\u5426\u4ee3\u53d1|\u5f00\u53d1\u5206\u914d|\u54c1\u724c\u7c7b\u522b|\u5f00\u53d1\u4e3b\u7ba1|\u8bbe\u8ba1\u5206\u914d|\u5f00\u53d1\u5206\u914d\u65f6\u95f4|\u8bbe\u8ba1\u5206\u914d\u65f6\u95f4|\u521b\u5efa\u65f6\u95f4|\u6700\u540e\u4fee\u6539\u65f6\u95f4|\u9879\u76ee\u4fe1\u606f|\u7269\u6599\u6e05\u5355|\u4ea7\u54c1\u4fe1\u606f)/;
    const match = String(text || '').match(new RegExp(escaped + '[:\uff1a]\\s*([\\s\\S]{0,80})'));
    if (!match) return '';
    return compactText(match[1]).split(stop)[0].trim();
  }

  function getProjectLooseField(text, fieldName) {
    const escaped = escapeRegExp(fieldName);
    const stop = /(\u9879\u76ee\u7f16\u7801|\u9700\u6c42\u7f16\u7801|\u5546\u54c1\u540d\u79f0|\u5546\u54c1\u7f16\u7801|\u7f8e\u5de5\u5904\u7406\u4f18\u5148\u7ea7|\u5e73\u53f0|\u4ea7\u54c1\u540d\u79f0|\u5173\u952e\u8bcd|\u8bbe\u8ba1\u7c7b\u578b|\u662f\u5426\u7206\u6b3e|\u662f\u5426\u4ee3\u53d1|\u5f00\u53d1\u5206\u914d|\u54c1\u724c\u7c7b\u522b|\u5f00\u53d1\u4e3b\u7ba1|\u8bbe\u8ba1\u5206\u914d|\u5176\u4ed6\u4fe1\u606f|\u5ba1\u6279\u72b6\u6001|\u9879\u76ee\u72b6\u6001|\u7269\u6599\u6e05\u5355|\u4ea7\u54c1\u4fe1\u606f)/;
    const match = String(text || '').match(new RegExp(escaped + '\\s*[:\uff1a]?\\s*([\\s\\S]{0,120})'));
    if (!match) return '';
    return compactText(match[1]).split(stop)[0].trim();
  }

  function extractProjectStatus(text) {
    const source = compactText(text || '');
    const statuses = ['\u5f85\u5ba1\u6838', '\u8fdb\u884c\u4e2d', '\u5df2\u62d2\u7edd', '\u5df2\u4f5c\u5e9f', '\u5df2\u5b8c\u6210'];
    const labeled = source.match(/\u9879\u76ee\u72b6\u6001\s*[:\uff1a]?\s*(\u5f85\u5ba1\u6838|\u8fdb\u884c\u4e2d|\u5df2\u62d2\u7edd|\u5df2\u4f5c\u5e9f|\u5df2\u5b8c\u6210)/);
    if (labeled) return labeled[1];
    return statuses.find((status) => source.includes(status)) || '';
  }

  function extractReferenceUrl(text) {
    const match = String(text || '').match(/\u5bf9\u6807\u94fe\u63a5\s*[:\uff1a]?\s*(https?:\/\/[^\s]+)/i);
    return match ? match[1].trim() : '';
  }

  function extractArtPriority(text) {
    const source = compactText(text || '');
    const match = source.match(/\bP[0-9]\s*[-\uff0d]\s*[\u4e00-\u9fa5A-Za-z0-9]{1,8}/);
    return match ? match[0].replace(/\s+/g, '') : '';
  }

  function getMaterialDisplayName(row, keywordPattern) {
    const name = extractMaterialName(row);
    if (!name) return '';
    const match = name.match(keywordPattern);
    return match ? name.slice(match.index).trim() : name.trim();
  }

  function extractMaterialCode(row) {
    const match = String(row || '').match(/\b(MTL\d+)\b/);
    return match ? match[1] : '';
  }

  function getCombinedPrintLabel(rows) {
    const labels = rows.map((row) => cleanPrintLabel(getMaterialDisplayName(row, /(\u6807\u7b7e|\u5370\u5237\u8f6f\u7ba1|\u5370\u5237\u5c3a\u5bf8|\u5370\u5237\u7ba1|\u5370\u5237\u74f6|\u5370\u5237\u4e73\u6db2\u74f6|\u5370\u5237)/) || extractPrintLabelFallback(row))).filter(Boolean);
    return labels.filter((label, index) => labels.indexOf(label) === index).join('\uff1b');
  }

  function extractPrintLabelFallback(row) {
    const match = String(row || '').match(/(\u6807\u7b7e|\u5370\u5237\u8f6f\u7ba1|\u5370\u5237\u5c3a\u5bf8|\u5370\u5237\u7ba1|\u5370\u5237\u74f6|\u5370\u5237\u4e73\u6db2\u74f6|\u5370\u5237)/);
    return match ? match[1] : '';
  }

  function cleanPrintLabel(label) {
    const text = compactText(label);
    if (/\u5370\u5237(?:\u4e73\u6db2\u74f6|\u8f6f\u7ba1|\u7ba1|\u74f6)/.test(text) || (/\u8f6f\u7ba1/.test(text) && /\u5370\u5237/.test(text))) return '\u5370\u5237';
    return text
      .replace(/\uff08\u4ef7\u683c\u5305\u542b\u4e8e\u534a\u6210\u54c1\uff09/g, '')
      .replace(/[\uff08(]\s*\u4ef7\u683c\u5305\u542b[\u5728\u4e8e]\s*\u534a\u6210\u54c1\s*[\uff09)]/g, '')
      .replace(/\uff08\u8fd4\u5de5\s*\u4e00\u6b21\u6027\uff09/g, '')
      .replace(/\uff08\u888b\u542b\u6599\uff09/g, '')
      .trim();
  }

  function extractMaterialName(row) {
    const match = String(row || '').match(/(?:MTL\d+\s+){1,2}(.+?)\s+\u5305\u6750\s*-/);
    return match ? match[1].trim() : '';
  }

  function extractNamedDimensionStrings(text) {
    const source = String(text || '');
    if (isTubePrintRow(source)) {
      const tubeDim = extractPrintDimensionString(source);
      return tubeDim ? [tubeDim] : [];
    }
    const axisDim = extractAxisDimensionString(source);
    const pattern = /(?:([\u4e00-\u9fa5A-Za-z0-9锛堬級()_-]{1,16})[:\uff1a]\s*)?(\d+(?:\.\d+)?\s*[xX\u00d7*]\s*\d+(?:\.\d+)?(?:\s*[xX\u00d7*]\s*\d+(?:\.\d+)?){0,4}\s*(?:cm|mm))/ig;
    const items = [];
    if (axisDim) items.push(axisDim);
    let match;
    while ((match = pattern.exec(source))) {
      let name = match[1] ? match[1].trim() : '';
      if (!name) {
        const before = source.slice(Math.max(0, match.index - 12), match.index);
        const implicit = before.match(/([\u4e00-\u9fa5A-Za-z0-9锛堬級()_-]{1,8})$/);
        name = implicit ? implicit[1].trim() : '';
      }
      const dim = normalizeDimensionText(match[2]);
      if (!dim) continue;
      if (items.includes(dim)) continue;
      items.push(name && !isGenericDimensionName(name) ? name + '\uff1a' + dim : dim);
    }
    return items;
  }

  function hasPrintDimensionText(text) {
    const source = String(text || '');
    return /\d+(?:\.\d+)?\s*[xX\u00d7*]\s*\d+(?:\.\d+)?(?:\s*[xX\u00d7*]\s*\d+(?:\.\d+)?){0,4}\s*(?:cm|mm)/i.test(source) || !!extractAxisDimensionString(source);
  }

  function extractPrintDimensionString(text) {
    const source = String(text || '');
    const axisDim = extractAxisDimensionString(source);
    if (axisDim) return axisDim;
    const match = source.match(/\u5370\u5237(?:\u5c3a\u5bf8)?[^\d]{0,12}(\d+(?:\.\d+)?\s*[xX\u00d7*]\s*\d+(?:\.\d+)?(?:\s*[xX\u00d7*]\s*\d+(?:\.\d+)?){0,4}\s*(?:cm|mm))/i);
    return match ? normalizeDimensionText(match[1]) : '';
  }

  function extractAxisDimensionString(text) {
    const source = String(text || '');
    const match = source.match(/\u5370\u5237(?:\u5c3a\u5bf8)?[^\d]{0,12}(?:\u957f|\u5bbd|\u9ad8)?\s*(\d+(?:\.\d+)?)\s*(cm|mm)?\s*(?:[xX\u00d7*]\s*)?(?:\u957f|\u5bbd|\u9ad8)\s*(\d+(?:\.\d+)?)\s*(cm|mm)/i);
    if (!match) return '';
    const unit = (match[4] || match[2] || 'cm').toLowerCase();
    return normalizeDimensionParts([match[1], match[3]], unit);
  }

  function isGenericDimensionName(name) {
    return /^(?:\u5370\u5237|\u6807\u7b7e|\u5370\u5237\u5c3a\u5bf8|\u6807\u7b7e\u5c3a\u5bf8|\u5c3a\u5bf8)$/.test(String(name || '').trim());
  }

  function isTubePrintRow(row) {
    const text = String(row || '');
    return /\u5370\u5237(?:\u8f6f\u7ba1|\u7ba1|\u74f6|\u4e73\u6db2\u74f6)/.test(text) || (/\u8f6f\u7ba1|\u767d\u7ba1|PE\u7ba1|pe\u7ba1|\u7ba1\u8eab|\u5c01\u5c3e|\u76d6\u5b50/.test(text) && /\u5370\u5237(?:\u5c3a\u5bf8)?/.test(text));
  }

  function isTubePrintData(data, packageNums) {
    const text = String(data.printRawText || '') + String(data.printSizeLabel || '') + String(data.printSizeText || '');
    if (data.tubeDiameter && data.tubeBody) return true;
    if (Boolean(data.isTubePrintMaterial) || isTubePrintRow(text)) return true;
    const printNums = parseDimension(data.printSizeText, 2);
    const labelLooksGenericPrint = /^\s*(?:\u5370\u5237|\u5370\u5237\u5c3a\u5bf8)?\s*$/.test(String(data.printSizeLabel || ''));
    return labelLooksGenericPrint && Array.isArray(printNums) && printNums.length === 2 && Array.isArray(packageNums) && packageNums.length >= 3;
  }

  function findTubeSizeSpec(text, fields) {
    const diameter = fields && fields.diameter ? fields.diameter : 0;
    const body = fields && fields.body ? fields.body : 0;
    if (!diameter || !body) return null;
    let spec = diameter && body ? TUBE_SIZE_SPECS.find((item) => item.diameter === diameter && item.body === body) : null;
    let rule = null;
    if (!spec && diameter && body) {
      rule = TUBE_SIZE_RULES.find((item) => item.diameter === diameter && item.bodies.includes(body));
      if (rule) spec = buildTubeSpecFromRule(rule, body);
    }
    if (!spec) return null;
    const tailSeal = (Number(spec.widths[1]) || 0) + (Number(spec.widths[2]) || 0);
    return {
      diameter,
      body,
      key: spec.key || (diameter + '\u7ba1\u5f84' + body + '\u7ba1\u8eab'),
      widths: spec.widths.slice(),
      printSizeText: formatTubeSpecPrintSize(spec),
      segmentText: spec.widths.map(formatCmSegment).join('-') + 'cm',
      tailSealText: formatSingleDimension(tailSeal),
    };
  }

  function buildTubeSpecFromRule(rule, body) {
    const size = getTubeRulePrintSize(rule, body);
    return {
      key: rule.diameter + '\u7ba1\u5f84' + body + '\u7ba1\u8eab',
      diameter: rule.diameter,
      body,
      widths: rule.widths.slice(),
      width: size.width,
      height: size.height,
    };
  }

  function extractTubeFields(root) {
    if (!root) return { diameter: 0, body: 0, text: '' };
    const fullText = getVisibleText(root);
    const diameter = normalizeTubeMeasureText(getFormValueByLooseLabel('\u7ba1\u5f84', root)) || extractTubeMeasure(fullText, '\u7ba1\u5f84');
    const body = normalizeTubeMeasureText(getFormValueByLooseLabel('\u7ba1\u8eab', root)) || extractTubeMeasure(fullText, '\u7ba1\u8eab');
    const parts = [];
    if (diameter) parts.push('\u7ba1\u5f84 ' + diameter + 'mm');
    if (body) parts.push('\u7ba1\u8eab ' + body + 'mm');
    return { diameter, body, text: parts.join(' ') };
  }

  function findTubeSizeRuleByPrintDimension(text) {
    const nums = extractTubePrintDimensionNums(text);
    if (!nums || nums.length < 2) return null;
    const width = Number(nums[0]);
    const height = Number(nums[1]);
    if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
    let best = null;
    TUBE_SIZE_RULES.forEach((rule) => {
      rule.bodies.forEach((body) => {
        const expected = getTubeRulePrintSize(rule, body);
        const directScore = Math.abs(expected.width - width) + Math.abs(expected.height - height);
        const swappedScore = Math.abs(expected.width - height) + Math.abs(expected.height - width) + 0.05;
        const score = Math.min(directScore, swappedScore);
        if (score <= 0.16 && (!best || score < best.score)) {
          best = { rule, diameter: rule.diameter, body, score };
        }
      });
    });
    return best;
  }

  function extractTubePrintDimensionNums(text) {
    const source = String(text || '');
    const labeled = source.match(/\u5370\u5237(?:\u5c3a\u5bf8)?[^\d]{0,20}(\d+(?:\.\d+)?)\s*[xX\u00d7*]\s*(\d+(?:\.\d+)?)\s*(mm|cm)/i);
    if (labeled) {
      const unit = labeled[3].toLowerCase();
      return [normalizeDimensionUnitNumber(labeled[1], unit), normalizeDimensionUnitNumber(labeled[2], unit)];
    }
    const dimension = source.match(/(\d+(?:\.\d+)?)\s*[xX\u00d7*]\s*(\d+(?:\.\d+)?)\s*(mm|cm)/i);
    if (!dimension) return null;
    const unit = dimension[3].toLowerCase();
    return [normalizeDimensionUnitNumber(dimension[1], unit), normalizeDimensionUnitNumber(dimension[2], unit)];
  }

  function getTubeRulePrintSize(rule, body) {
    const width = rule.widths.reduce((sum, value) => sum + (Number(value) || 0), 0);
    const height = Math.max(0, (Number(body) || 0) / 10 - 0.1);
    return { width, height };
  }

  function formatTubePrintSize(rule, body) {
    const size = getTubeRulePrintSize(rule, body);
    if (!Number.isFinite(size.width) || !Number.isFinite(size.height)) return '';
    return trimNumber(size.width) + 'x' + trimNumber(size.height) + 'cm';
  }

  function formatTubeSpecPrintSize(spec) {
    if (!spec || !Number.isFinite(Number(spec.width)) || !Number.isFinite(Number(spec.height))) return '';
    return trimNumber(Number(spec.width)) + 'x' + trimNumber(Number(spec.height)) + 'cm';
  }

  function normalizeDimensionUnitNumber(value, unit) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return String(unit || '').toLowerCase() === 'mm' ? num / 10 : num;
  }

  function extractTubeMeasure(text, label) {
    const source = String(text || '');
    const escaped = escapeRegExp(label);
    const labelPair = source.match(/\u7ba1\u5f84\s+\u7ba1\u8eab\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/i);
    if (labelPair) return normalizeTubeMeasureValue(label === '\u7ba1\u5f84' ? labelPair[1] : labelPair[2], '');
    const inlinePair = source.match(/\u7ba1\u5f84[^\d]{0,12}(\d+(?:\.\d+)?)\s*(mm|cm)?[^\u7ba1\d]{0,20}\u7ba1\u8eab[^\d]{0,12}(\d+(?:\.\d+)?)\s*(mm|cm)?/i);
    if (inlinePair) {
      return label === '\u7ba1\u5f84'
        ? normalizeTubeMeasureValue(inlinePair[1], inlinePair[2])
        : normalizeTubeMeasureValue(inlinePair[3], inlinePair[4]);
    }
    const labelIndex = source.search(new RegExp(escaped, 'i'));
    const scope = labelIndex >= 0 ? source.slice(labelIndex, labelIndex + 120) : source;
    const direct = scope.match(new RegExp(escaped + '[^\\d]{0,24}(\\d+(?:\\.\\d+)?)\\s*(mm|cm)?', 'i'));
    if (direct) return normalizeTubeMeasureValue(direct[1], direct[2]);
    const tableLike = scope.match(/(\d+(?:\.\d+)?)\s*(mm|cm)/i);
    if (tableLike) return normalizeTubeMeasureValue(tableLike[1], tableLike[2]);
    return 0;
  }

  function normalizeTubeMeasureText(text) {
    const match = String(text || '').match(/(\d+(?:\.\d+)?)\s*(mm|cm)?/i);
    return match ? normalizeTubeMeasureValue(match[1], match[2]) : 0;
  }

  function normalizeTubeMeasureValue(value, unit) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return 0;
    const normalized = String(unit || '').toLowerCase() === 'cm' ? num * 10 : num;
    return Math.round(normalized);
  }

  function formatCmSegment(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '';
    const text = String(number);
    return text.includes('.') ? text : text + '.0';
  }

  function getMaterialRows(root) {
    return Array.from(root.querySelectorAll('tr, .ant-table-row, [role="row"]'))
      .filter(isVisibleElement)
      .map((el) => compactText(el.innerText || el.textContent || ''))
      .filter((text, idx, arr) => text && arr.indexOf(text) === idx);
  }

  function extractNetContentFromMaterial(row) {
    const tabletMatch = String(row || '').match(/(\d+(?:\.\d+)?)\s*\u7247\s*(?:\/\s*(?:\u76d2|\u74f6|\u888b))?/i);
    if (tabletMatch) return trimNumber(Number(tabletMatch[1])) + 'TABLETS';
    const pcsMatch = String(row || '').match(/(\d+(?:\.\d+)?)\s*PCS?\s*(?:\/\s*(?:\u4ef6|\u76d2|\u74f6|\u888b))?/i);
    if (pcsMatch) return trimNumber(Number(pcsMatch[1])) + 'PC';
    const pairMatch = String(row || '').match(/(\d+(?:\.\d+)?)\s*\u5957\s*\/\s*\u76d2/i);
    if (pairMatch) {
      const count = Number(pairMatch[1]);
      return trimNumber(count) + (count === 1 ? 'PAIR' : 'PAIRS');
    }
    const match = String(row || '').match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|mL|l|L|\u514b|\u5343\u514b|\u6beb\u5347|\u5347)\s*\/\s*\u76d2/i);
    if (!match) return '';
    const unitMap = {
      '\u514b': 'g',
      '\u5343\u514b': 'kg',
      '\u6beb\u5347': 'ml',
      '\u5347': 'L',
    };
    const unit = unitMap[match[2]] || match[2];
    return trimNumber(Number(match[1])) + unit;
  }

  function extractDimensionString(text) {
    const matches = String(text || '').match(/\d+(?:\.\d+)?(?:\s*[xX\u00d7*]\s*\d+(?:\.\d+)?\s*(?:(?:cm|mm))?){1,4}\s*(?:cm|mm)/ig);
    if (!matches || !matches.length) return '';
    return normalizeDimensionText(matches[matches.length - 1]);
  }

  function normalizeDimensionText(text) {
    const source = String(text || '');
    const nums = source.match(/\d+(?:\.\d+)?/g);
    if (!nums || nums.length < 2) return '';
    const unitMatch = source.match(/(mm|cm)\s*$/i) || source.match(/\b(mm|cm)\b/i);
    return normalizeDimensionParts(nums, unitMatch ? unitMatch[1] : 'cm');
  }

  function normalizeDimensionParts(nums, unit) {
    const divisor = String(unit || '').toLowerCase() === 'mm' ? 10 : 1;
    return nums.map((n) => trimNumber(Number(n) / divisor)).join('x') + 'cm';
  }

  function extractOuterPackage(root) {
    const nums = [
      getFormValueByLabel('\u957f\uff08\u5916\u5305\u88c5\uff09', root),
      getFormValueByLabel('\u5bbd\uff08\u5916\u5305\u88c5\uff09', root),
      getFormValueByLabel('\u9ad8\uff08\u5916\u5305\u88c5\uff09', root),
    ].map(firstNumber);
    return nums.every((n) => Number.isFinite(n)) ? { packageNums: nums } : { packageNums: null };
  }

  function emptyPackaging() {
    return { packageSizeText: '', packageSizeLabel: '', packageCode: '', packageNums: null, hasInnerCard: false, printSizeText: '', printSizeLabel: '', printCode: '', netContent: '' };
  }

  function extractFoodSemiFinished(root) {
    const row = getMaterialRows(root).find((text) => /\u534a\u6210\u54c1/.test(text) && /\u98df\u54c1\u7c7b/.test(text) && /(\u80f6\u56ca|\u8f6f\u7cd6)/.test(text)) || '';
    if (!row) return emptyFoodSemiFinished();
    const dim = extractDimensionString(row);
    const nums = parseDimension(dim, 2);
    const productNums = nums && nums.length >= 2 ? [nums[0], nums[0], nums[1]] : null;
    const count = (row.match(/(\d+(?:\.\d+)?)\s*\u7c92/) || [])[1];
    const type = /\u8f6f\u7cd6/.test(row) ? 'GUMMIES' : 'CAPSULES';
    return {
      productNums,
      netContent: count ? trimNumber(Number(count)) + type : '',
    };
  }

  function emptyFoodSemiFinished() {
    return { productNums: null, netContent: '' };
  }

  function getBestNetContent(root) {
    return extractSpecModelNetContent(root);
  }

  function normalizeNetContentValue(value) {
    const text = compactText(value);
    if (!text) return '';
    const pcMatch = text.match(/(\d+(?:\.\d+)?)\s*PCS?\s*(?:\/\s*(?:\u4ef6|\u76d2|\u74f6|\u888b))?/i);
    if (pcMatch) return trimNumber(Number(pcMatch[1])) + 'PC';
    if (/^\d+(?:\.\d+)?\s*(CAPSULES|GUMMIES|TABLETS|PAIR|PAIRS|PC)$/i.test(text)) return text.replace(/\s+/g, '').toUpperCase();
    const tabletMatch = text.match(/(\d+(?:\.\d+)?)\s*\u7247\s*(?:\/\s*(?:\u76d2|\u74f6|\u888b))?/i);
    if (tabletMatch) return trimNumber(Number(tabletMatch[1])) + 'TABLETS';
    const weightMatch = text.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|\u514b|\u5343\u514b|\u6beb\u5347|\u5347)\s*(?:\/\s*[\u4e00-\u9fa5A-Za-z]+)?/i);
    if (weightMatch) {
      return formatNetContentAmount(weightMatch[1], weightMatch[2]);
    }
    return '';
  }

  function extractSpecModelNetContent(root) {
    const lines = getVisibleText(root).split('\n').map((line) => compactText(line)).filter(Boolean);
    for (let i = 0; i < lines.length; i += 1) {
      if (!/\u89c4\u683c\u578b\u53f7/.test(lines[i])) continue;
      const sameLine = lines[i].replace(/\u89c4\u683c\u578b\u53f7[:\uff1a]?/, '').trim();
      const candidates = [sameLine, lines[i + 1] || ''].filter(Boolean);
      for (const candidate of candidates) {
        const normalized = normalizeNetContentValue(candidate);
        if (normalized) return normalized;
      }
    }
    return '';
  }

  function formatNetContentAmount(amount, unitRaw) {
    const unitMap = { '\u514b': 'g', '\u5343\u514b': 'kg', '\u6beb\u5347': 'ml', '\u5347': 'L' };
    return trimNumber(Number(amount)) + (unitMap[unitRaw] || unitRaw);
  }

  function productNumsFromPackage(packageNums, hasInnerCard) {
    if (!Array.isArray(packageNums) || packageNums.length < 3) return null;
    const delta = hasInnerCard ? INNER_CARD_DELTA_CM : NORMAL_DELTA_CM;
    return packageNums.slice(0, 3).map((n) => Math.max(0, n - delta));
  }

  function formatDimensionPart(nums, index) {
    if (!Array.isArray(nums) || !Number.isFinite(nums[index])) return '';
    return formatSingleDimension(nums[index]);
  }

  function formatSingleDimension(value) {
    if (!Number.isFinite(Number(value))) return '';
    const cm = trimNumber(Number(value));
    const inch = trimNumber(Number(value) * CM_TO_INCH);
    return cm + 'cm/' + inch + 'inch';
  }

  function getFormValueByLabel(fieldLabel, root) {
    const labels = Array.from(root.querySelectorAll('label, .ant-form-item-label, .ant-descriptions-item-label, [class*="label"], [class*="Label"]'))
      .filter(isVisibleElement)
      .filter((el) => normalizeFieldLabel(el.textContent) === fieldLabel);
    for (const labelEl of labels) {
      const item = labelEl.closest('.ant-form-item') || labelEl.parentElement;
      if (!item || !isVisibleElement(item)) continue;
      const text = compactText(item.innerText || item.textContent || '');
      const value = text.replace(new RegExp('^' + escapeRegExp(fieldLabel) + '\\*?\\s*'), '').trim();
      const cleaned = cleanValue(value);
      if (cleaned) return cleaned;
    }
    return '';
  }

  function getFormValueByLooseLabel(fieldLabel, root) {
    const expected = normalizeLooseFieldLabel(fieldLabel);
    const labels = Array.from(root.querySelectorAll('label, .ant-form-item-label, .ant-descriptions-item-label, [class*="label"], [class*="Label"]'))
      .filter(isVisibleElement)
      .filter((el) => normalizeLooseFieldLabel(el.textContent) === expected);
    for (const labelEl of labels) {
      const item = labelEl.closest('.ant-form-item') || labelEl.closest('.ant-descriptions-item') || labelEl.parentElement;
      if (!item || !isVisibleElement(item)) continue;
      const text = compactText(item.innerText || item.textContent || '');
      const value = text
        .replace(new RegExp('^' + escapeRegExp(normalizeFieldLabel(labelEl.textContent)) + '\\*?\\s*'), '')
        .replace(new RegExp('^' + escapeRegExp(fieldLabel) + '(?:\\s*[\\uff08(][^\\uff09)]*[\\uff09)])?\\*?\\s*'), '')
        .trim();
      const cleaned = cleanValue(value);
      if (cleaned) return cleaned;
    }
    return getFormValueByLabel(fieldLabel, root);
  }

  function normalizeLooseFieldLabel(text) {
    return normalizeFieldLabel(text)
      .replace(/[\uff08(]\s*(?:mm|cm|\u6beb\u7c73|\u5398\u7c73)\s*[\uff09)]/ig, '')
      .replace(/\s+/g, '')
      .trim();
  }

  function normalizeWeight(raw) {
    if (!raw) return '';
    const match = String(raw).match(/(\d+(?:\.\d+)?)\s*(kg|\u5343\u514b|g|\u514b)/i);
    if (!match) return cleanValue(raw);
    const unit = /kg|\u5343\u514b/i.test(match[2]) ? 'kg' : 'g';
    return trimNumber(Number(match[1])) + unit;
  }

  function cleanValue(value) {
    const text = compactText(value);
    if (!text || text === '--' || /^--\s*(g|kg|ml|mL|l|L|\u514b|\u5343\u514b|\u6beb\u5347|\u5347|\w*\([^)]*\))?/i.test(text)) return '';
    if (/^[\s:：*]*(\u51c0\u542b\u91cf|\u51c0\u91cd|\u6bdb\u91cd|\u89c4\u683c\u578b\u53f7|\u5bb9\u91cf)(\s+|\u3000)*(\u51c0\u542b\u91cf|\u51c0\u91cd|\u6bdb\u91cd|\u89c4\u683c\u578b\u53f7|\u5bb9\u91cf)?[\s:：*]*$/.test(text)) return '';
    return text;
  }

  function parseDimension(text, limit) {
    const nums = String(text || '').match(/\d+(?:\.\d+)?/g);
    if (!nums || nums.length < limit) return null;
    return nums.map(Number);
  }

  function appendChineseRemark(label, remark) {
    const base = label || L.packageSize;
    return new RegExp('\uff08' + escapeRegExp(remark) + '\uff09').test(base) ? base : base + '\uff08' + remark + '\uff09';
  }

  function firstNumber(text) {
    const match = String(text || '').match(/\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : NaN;
  }

  function findSku(text) {
    return (text.match(/\u5546\u54c1\u7f16\u7801[:\uff1a]\s*(SKU\d+)/i) || text.match(/\b(SKU\d+)\b/i) || [])[1] || '';
  }

  function cleanName(name) {
    return compactText(name)
      .replace(/\s*(\u5546\u54c1\u7f16\u7801|\u7f8e\u5de5\u5904\u7406\u4f18\u5148\u7ea7|PRODUCT NAME)[:\uff1a].*$/i, '')
      .replace(/\s*[\uff08(]\d+[\uff09)]\s*$/g, '')
      .trim();
  }

  function findTabButton(root, text) {
    const candidates = Array.from(root.querySelectorAll('[role="tab"], .ant-tabs-tab, .ant-tabs-tab-btn, button, div'))
      .filter(isVisibleElement)
      .filter((el) => compactText(el.textContent) === text);
    return candidates.find((el) => el.getAttribute('role') === 'tab')
      || candidates.find((el) => String(el.className || '').includes('ant-tabs-tab-btn'))
      || candidates[0]
      || null;
  }

  function getActiveTabText(root) {
    const active = Array.from(root.querySelectorAll('[role="tab"], .ant-tabs-tab'))
      .filter(isVisibleElement)
      .find(isActiveTab);
    return active ? compactText(active.textContent) : '';
  }

  function isActiveTab(tab) {
    const tabRoot = tab.closest('.ant-tabs-tab') || tab;
    return /\bant-tabs-tab-active\b/.test(String(tabRoot.className || ''))
      || tab.getAttribute('aria-selected') === 'true';
  }

  function ensurePanel() {
    let panel = document.getElementById(PANEL_ID);
    if (panel) {
      if (panel.dataset.version !== SCRIPT_VERSION) {
        panel.remove();
        panel = null;
      } else {
        panel.dataset.version = SCRIPT_VERSION;
        return panel;
      }
    }
    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.dataset.version = SCRIPT_VERSION;
    panel.innerHTML = '<div class="pfh-full"><div class="pfh-header"><div class="pfh-heading"><strong></strong><div class="pfh-search"><span class="pfh-search-box"><input type="search" class="pfh-search-input" autocomplete="off" autocapitalize="off" spellcheck="false" data-lpignore="true"><button type="button" class="pfh-search-clear" data-action="clear-search"></button></span><button type="button" data-action="search"></button></div></div><div class="pfh-actions"><button type="button" data-action="about"></button><button type="button" data-action="home-main"></button><button type="button" data-action="collapse"></button></div></div><div class="pfh-main"><aside class="pfh-list"></aside><div class="pfh-splitter" title="\u62d6\u52a8\u8c03\u6574\u5de6\u53f3\u5bbd\u5ea6"></div><div class="pfh-detail"></div></div><input type="file" class="pfh-import-file" accept="application/json,.json"><div class="pfh-resize-handle pfh-resize-n" data-resize-dir="n"></div><div class="pfh-resize-handle pfh-resize-e" data-resize-dir="e"></div><div class="pfh-resize-handle pfh-resize-s" data-resize-dir="s"></div><div class="pfh-resize-handle pfh-resize-w" data-resize-dir="w"></div><div class="pfh-resize-handle pfh-resize-ne" data-resize-dir="ne"></div><div class="pfh-resize-handle pfh-resize-nw" data-resize-dir="nw"></div><div class="pfh-resize-handle pfh-resize-se" data-resize-dir="se" title="\u62d6\u52a8\u8c03\u6574\u7a97\u53e3\u5927\u5c0f"></div><div class="pfh-resize-handle pfh-resize-sw" data-resize-dir="sw"></div></div>';
    document.documentElement.appendChild(panel);
    panel.querySelector('.pfh-heading').insertAdjacentHTML('afterbegin', '<button type="button" class="pfh-collection-mark" data-action="toggle-collection" role="switch" aria-label="\u6570\u636e\u91c7\u96c6">P</button>');
    panel.querySelector('strong').textContent = L.title;
    panel.querySelector('.pfh-search-input').placeholder = L.searchPlaceholder;
    panel.querySelector('.pfh-search-clear').textContent = '\u00d7';
    panel.querySelector('.pfh-search-clear').title = L.clearSearch;
    panel.querySelector('[data-action="search"]').innerHTML = '<span class="pfh-btn-text">' + escapeHtml(L.search) + '</span>';
    panel.querySelector('[data-action="search"]').title = TOOLTIP.search;
    panel.querySelector('[data-action="about"]').innerHTML = iconHtml('settings') + '<span>\u8bbe\u7f6e</span>';
    panel.querySelector('[data-action="about"]').removeAttribute('title');
    panel.querySelector('[data-action="about"]').setAttribute('aria-label', TOOLTIP.about);
    panel.querySelector('[data-action="about"]').setAttribute('data-tooltip', TOOLTIP.about);
    panel.querySelector('[data-action="home-main"]').innerHTML = iconHtml('home') + '<span>\u4e3b\u9875</span>';
    panel.querySelector('[data-action="home-main"]').removeAttribute('title');
    panel.querySelector('[data-action="home-main"]').setAttribute('aria-label', '\u4e3b\u9875');
    panel.querySelector('[data-action="home-main"]').setAttribute('data-tooltip', '\u4e3b\u9875');
    panel.querySelector('[data-action="collapse"]').setAttribute('data-action', 'panel-close');
    panel.addEventListener('click', handlePanelClick);
    panel.addEventListener('keydown', handlePanelKeydown);
    panel.addEventListener('input', handlePanelInput);
    panel.addEventListener('paste', handlePanelPaste);
    panel.addEventListener('change', handlePanelChange);
    panel.addEventListener('dragover', handlePanelDragOver);
    panel.addEventListener('drop', handlePanelDrop);
    panel.querySelector('.pfh-import-file').addEventListener('change', handleImportFile);
    makeDraggable(panel, panel.querySelector('.pfh-header'));
    makeSplitterDraggable(panel, panel.querySelector('.pfh-splitter'));
    makePanelResizable(panel);
    applySavedPosition(panel);
    applyPanelSize(panel);
    applySplitWidth(panel);
    updatePanelPinButton(panel);
    return panel;
  }

  function ensureLauncher() {
    let launcher = document.getElementById(LAUNCHER_ID);
    if (!launcher) {
      launcher = document.createElement('button');
      launcher.id = LAUNCHER_ID;
      launcher.type = 'button';
      launcher.textContent = L.mini;
      launcher.addEventListener('click', handleLauncherClick, true);
      document.documentElement.appendChild(launcher);
      makeLauncherDraggable(launcher);
    }
    positionLauncher(launcher);
    return launcher;
  }

  function iconHtml(name) {
    const icons = {
      home: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M453.037 86.017c33.826-29.356 84.099-29.356 117.926 0l374.262 324.79c16.676 14.472 18.461 39.72 3.988 56.393a39.982 39.982 0 0 1-30.194 13.773h-69.096v389.083c0 49.178-39.472 89.138-88.467 89.932l-1.488 0.012H263.904c-49.681 0-89.956-40.27-89.956-89.944V480.973H104.98c-21.86 0-39.622-17.541-39.98-39.314v-0.661a39.973 39.973 0 0 1 13.774-30.19z m78.617 45.285c-11.276-9.785-28.033-9.785-39.309 0L158.508 421.01h35.43c21.86 0 39.622 17.541 39.975 39.314l0.006 0.661v409.07c0 16.559 13.424 29.982 29.985 29.982h496.064c16.56 0 29.985-13.423 29.985-29.981v-409.07c0-22.078 17.9-39.976 39.98-39.976h35.557z m110.285 654.805c16.558 0 29.981 13.423 29.981 29.982 0 16.558-13.423 29.981-29.981 29.981H382.06c-16.559 0-29.982-13.423-29.982-29.981 0-16.559 13.423-29.982 29.982-29.982h259.878z"></path></svg>',
      link: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M722.664727 628.736a34.955636 34.955636 0 0 1-24.692363-59.601455l154.949818-154.926545c68.049455-68.049455 68.049455-178.781091 0-246.853818-68.072727-68.049455-178.850909-68.049455-246.877091 0l-154.926546 154.926545a34.909091 34.909091 0 1 1-49.338181-49.361454L556.683636 117.992727c95.278545-95.232 250.321455-95.278545 345.6 0 95.278545 95.278545 95.278545 250.321455 0 345.576728l-154.926545 154.949818a34.792727 34.792727 0 0 1-24.669091 10.216727zM290.816 973.707636a243.665455 243.665455 0 0 1-172.823273-71.447272c-95.278545-95.301818-95.278545-250.321455 0-345.6l138.472728-138.449455a34.909091 34.909091 0 1 1 49.384727 49.361455l-138.472727 138.449454c-68.072727 68.049455-68.072727 178.804364 0 246.877091 68.072727 68.049455 178.827636 68.002909 246.853818 0l138.472727-138.496a34.909091 34.909091 0 1 1 49.338182 49.361455l-138.426182 138.472727a243.595636 243.595636 0 0 1-172.8 71.447273z m137.076364-346.414545a34.955636 34.955636 0 0 1-24.692364-59.601455l164.538182-164.538181a34.909091 34.909091 0 1 1 49.361454 49.361454l-164.538181 164.561455a34.792727 34.792727 0 0 1-24.669091 10.24z"></path></svg>',
      taskPlan: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M449.408 896H192a64 64 0 0 1-64-64V192a64 64 0 0 1 64-64h576a64 64 0 0 1 64 64v219.008c23.04 10.112 44.096 23.424 64 38.464V192a128 128 0 0 0-128-128H192a128 128 0 0 0-128 128v640a128 128 0 0 0 128 128h321.728a322.432 322.432 0 0 1-64.32-64z"></path><path d="M704 448a256 256 0 1 0 0 512 256 256 0 0 0 0-512z m0 447.872a191.872 191.872 0 1 1 0-383.808 191.872 191.872 0 0 1 0 383.808z"></path><path d="M800 672h-64V640a32 32 0 0 0-64 0v64a32 32 0 0 0 32 32h96a32 32 0 0 0 0-64zM438.848 265.216a31.808 31.808 0 0 0-44.992 0L287.232 371.84l-42.688-42.688a30.72 30.72 0 1 0-43.456 43.456l59.584 59.584c1.344 2.304 2.432 4.672 4.416 6.656 6.656 6.592 15.36 9.408 23.936 9.088a30.848 30.848 0 0 0 21.824-9.024c0.704-0.704 1.024-1.6 1.6-2.432l126.4-126.336a31.744 31.744 0 0 0 0-44.928zM544 320a32 32 0 0 0 0 64h192a32 32 0 0 0 0-64h-192zM393.856 489.216L287.232 595.84l-42.688-42.688a30.72 30.72 0 1 0-43.456 43.456l59.584 59.584c1.344 2.304 2.432 4.672 4.416 6.656 6.656 6.592 15.36 9.408 23.936 9.088a30.848 30.848 0 0 0 21.824-9.024c0.704-0.704 1.024-1.6 1.6-2.432l126.4-126.336a31.872 31.872 0 0 0-44.992-44.928z"></path></svg>',
      settings: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M512.7 664.3c-82.9 0-150.4-67.4-150.4-150.4 0-82.9 67.4-150.4 150.4-150.4 82.9 0 150.4 67.4 150.4 150.4-0.1 83-67.5 150.4-150.4 150.4z m0-244.7c-52 0-94.4 42.3-94.4 94.4 0 52 42.3 94.4 94.4 94.4S607 566 607 514c0-52-42.3-94.4-94.3-94.4z"></path><path d="M631.2 940.5c-15.2 0-30.1-6-41.2-17.3l-63.5-64.8c-4.1-4.2-9.5-6.5-15.4-6.5-5.8 0-11.3 2.3-15.3 6.4l-63.5 64.4c-17.4 17.6-44 22.2-66.2 11.4l-94.5-45.7c-22.2-10.8-35.2-34.5-32.2-59l11-90.1c0.7-5.8-0.9-11.5-4.5-16-3.6-4.6-8.8-7.4-14.6-8l-89.9-9.5c-24.6-2.6-44.8-20.5-50.2-44.6L67.7 558.8c-5.5-24.1 5-49 26-62l77.3-47.6c5-3.1 8.4-7.9 9.7-13.5 1.3-5.7 0.3-11.5-2.8-16.4L129.2 343c-13.3-20.8-11.9-47.8 3.5-67.1l65.5-82c15.4-19.3 41.4-26.7 64.7-18.3l85.4 30.7c5.5 2 11.4 1.7 16.6-0.9 5.2-2.5 9.2-7 11.1-12.5l29.2-85.6c8-23.4 29.9-39.1 54.6-39.1h105c24.7 0 46.7 15.7 54.6 39.1l29.6 86.8c1.9 5.5 5.8 9.9 11 12.5s11.1 2.8 16.6 0.9l86.1-30.6c23.3-8.3 49.2-0.8 64.6 18.5l65.2 82.3c15.3 19.4 16.7 46.3 3.3 67.1l-49.1 76.3c-3.2 4.9-4.2 10.7-2.9 16.4 1.3 5.7 4.7 10.5 9.7 13.6l76.8 47.7c21 13 31.4 38 25.8 62l-23.6 102.3a57.67 57.67 0 0 1-50.4 44.4l-90.3 9.2c-5.8 0.6-11 3.4-14.6 8-3.6 4.5-5.3 10.2-4.6 16l10.7 89.8c2.9 24.5-10.1 48.2-32.4 58.9l-94.7 45.4c-8.1 3.9-16.6 5.7-25 5.7zM511 795.9h0.1c21 0 40.6 8.3 55.3 23.3l63.5 64.8c0.5 0.5 1.3 0.7 2 0.4l94.7-45.4c0.7-0.3 1.1-1 1-1.8l-10.7-89.8c-2.5-20.8 3.4-41.3 16.5-57.6s31.8-26.5 52.7-28.7l90.3-9.2c0.7-0.1 1.3-0.6 1.5-1.3l23.6-102.3c0.2-0.7-0.1-1.5-0.8-1.9l-76.8-47.7c-17.8-11.1-30.2-28.4-34.8-48.8-4.6-20.4-0.9-41.4 10.5-59l49.1-76.3c0.4-0.6 0.4-1.4-0.1-2l-65.2-82.3c-0.5-0.6-1.2-0.8-1.9-0.6l-86.1 30.6c-19.7 7-40.9 5.9-59.7-3.2-18.8-9.1-32.9-25-39.7-44.8l-29.6-86.8c-0.2-0.7-0.9-1.2-1.6-1.2h-105c-0.7 0-1.4 0.5-1.6 1.2L429 211c-6.8 19.8-20.9 35.8-39.8 44.9-18.9 9.1-40.1 10.2-59.9 3.1l-85.4-30.7c-0.7-0.2-1.5 0-1.9 0.5l-65.5 82c-0.5 0.6-0.5 1.4-0.1 2l48.7 76.2c11.3 17.7 14.9 38.6 10.2 59.1-4.7 20.4-17.1 37.7-34.9 48.7l-77.3 47.6c-0.6 0.4-0.9 1.1-0.8 1.9l23.3 102.4c0.2 0.7 0.8 1.3 1.5 1.3l89.9 9.5c20.8 2.2 39.5 12.4 52.6 28.8 13 16.4 18.8 36.9 16.3 57.7l-11 90.1c-0.1 0.7 0.3 1.4 1 1.8l94.5 45.7c0.7 0.3 1.5 0.2 2-0.3l63.5-64.4c14.6-14.8 34.2-23 55.1-23z"></path></svg>',
      folder: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M752 80H272c-70.4 0-128 57.6-128 128v608c0 70.4 57.6 128 128 128h353.6c33.6 0 65.6-12.8 91.2-36.8l126.4-126.4c24-24 36.8-56 36.8-91.2V208c0-70.4-57.6-128-128-128zM208 816V208c0-35.2 28.8-64 64-64h480c35.2 0 64 28.8 64 64v464h-96c-70.4 0-128 57.6-128 128v80H272c-35.2 0-64-28.8-64-64z m462.4 44.8c-4.8 4.8-9.6 8-14.4 11.2V800c0-35.2 28.8-64 64-64h75.2l-124.8 124.8z"></path><path d="M368 352h288c17.6 0 32-14.4 32-32s-14.4-32-32-32H368c-17.6 0-32 14.4-32 32s14.4 32 32 32zM496 608h-128c-17.6 0-32 14.4-32 32s14.4 32 32 32h128c17.6 0 32-14.4 32-32s-14.4-32-32-32zM368 512h288c17.6 0 32-14.4 32-32s-14.4-32-32-32H368c-17.6 0-32 14.4-32 32s14.4 32 32 32z"></path></svg>',
      upload: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M802 664v146c0 7.7-6.3 14-14 14H236c-7.7 0-14-6.3-14-14V664c0-5.5-4.5-10-10-10h-50c-5.5 0-10 4.5-10 10v170c0 33.1 26.9 60 60 60h600c33.1 0 60-26.9 60-60V664c0-5.5-4.5-10-10-10h-50c-5.5 0-10 4.5-10 10z"></path><path d="M547 697V247.5l173.6 173.6c13.7 13.7 35.8 13.7 49.5 0 13.7-13.7 13.7-35.8 0-49.5L536.8 138.3c-0.4-0.4-0.8-0.8-1.3-1.2-0.2-0.2-0.4-0.4-0.6-0.5-0.2-0.2-0.4-0.4-0.7-0.6-0.3-0.2-0.5-0.4-0.8-0.6-0.2-0.1-0.4-0.3-0.5-0.4l-0.9-0.6c-0.2-0.1-0.3-0.2-0.5-0.3-0.3-0.2-0.6-0.4-1-0.6-0.2-0.1-0.3-0.2-0.5-0.3-0.3-0.2-0.6-0.4-1-0.5-0.2-0.1-0.4-0.2-0.5-0.3-0.3-0.2-0.6-0.3-0.9-0.5l-0.6-0.3c-0.3-0.1-0.6-0.3-0.8-0.4-0.2-0.1-0.5-0.2-0.7-0.3-0.3-0.1-0.5-0.2-0.8-0.3l-0.9-0.3c-0.2-0.1-0.4-0.2-0.7-0.2-0.3-0.1-0.6-0.2-1-0.3-0.2-0.1-0.4-0.1-0.6-0.2-0.4-0.1-0.7-0.2-1.1-0.3-0.2 0-0.4-0.1-0.6-0.1-0.4-0.1-0.7-0.2-1.1-0.2-0.2 0-0.4-0.1-0.6-0.1-0.4-0.1-0.7-0.1-1.1-0.2-0.2 0-0.4-0.1-0.7-0.1-0.3 0-0.7-0.1-1-0.1-0.3 0-0.6 0-0.9-0.1-0.3 0-0.5 0-0.8-0.1-1.2-0.1-2.3-0.1-3.5 0-0.3 0-0.5 0-0.8 0.1-0.3 0-0.6 0-0.9 0.1-0.3 0-0.7 0.1-1 0.1-0.2 0-0.4 0.1-0.7 0.1-0.4 0.1-0.7 0.1-1.1 0.2-0.2 0-0.4 0.1-0.6 0.1-0.4 0.1-0.7 0.2-1.1 0.2-0.2 0-0.4 0.1-0.6 0.1-0.4 0.1-0.7 0.2-1.1 0.3-0.2 0.1-0.4 0.1-0.6 0.2-0.3 0.1-0.6 0.2-1 0.3-0.2 0.1-0.5 0.1-0.7 0.2l-0.9 0.3c-0.3 0.1-0.5 0.2-0.8 0.3-0.2 0.1-0.5 0.2-0.7 0.3-0.3 0.1-0.6 0.3-0.8 0.4l-0.6 0.3c-0.3 0.2-0.6 0.3-0.9 0.5-0.2 0.1-0.4 0.2-0.5 0.3-0.3 0.2-0.6 0.4-1 0.6-0.2 0.1-0.3 0.2-0.5 0.3-0.3 0.2-0.6 0.4-1 0.6-0.2 0.1-0.3 0.2-0.5 0.3-0.3 0.2-0.6 0.4-0.9 0.7-0.2 0.1-0.3 0.3-0.5 0.4-0.3 0.2-0.5 0.4-0.8 0.6-0.2 0.2-0.4 0.4-0.7 0.6-0.2 0.2-0.4 0.4-0.6 0.5l-1.2 1.2-233.1 233.1c-13.7 13.7-13.7 35.8 0 49.5 13.7 13.7 35.8 13.7 49.5 0L477 247.5V697c0 19.3 15.7 35 35 35s35-15.7 35-35z"></path></svg>',
      collapse: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="12" height="16" rx="2"></rect><path d="M9 8h6M9 12h6M9 16h4"></path></svg>',
      close: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M859.00288 178.741248c-188.43648-188.471296-495.06304-188.471296-683.49952 0-188.469248 188.432384-188.469248 495.060992 0 683.493376 188.43648 188.473344 495.06304 188.473344 683.49952 0C1047.472128 673.80224 1047.472128 367.173632 859.00288 178.741248zM809.965568 813.19936c-161.41312 161.409024-424.04864 161.376256-585.424896 0-161.409024-161.41312-161.409024-424.011776 0-585.424896 161.376256-161.376256 424.011776-161.409024 585.424896 0C971.341824 389.15072 971.341824 651.8272 809.965568 813.19936z"></path><path d="M571.764736 518.862848l154.630144-154.871808c13.508608-13.529088 13.508608-35.463168 0-48.992256-13.508608-13.529088-35.407872-13.529088-48.91648 0l-154.628096 154.86976L362.14784 308.92032c-13.45536-13.473792-35.270656-13.473792-48.726016 0-13.453312 13.477888-13.453312 35.325952 0 48.80384l160.698368 160.950272-168.409088 168.67328c-13.510656 13.529088-13.510656 35.465216 0 48.994304 13.508608 13.529088 35.407872 13.529088 48.914432 0l168.411136-168.675328 160.700416 160.950272c13.45536 13.473792 35.270656 13.473792 48.726016 0 13.45536-13.477888 13.45536-35.325952 0-48.801792L571.764736 518.862848z"></path></svg>',
      refresh: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M850.845805 255.97539c-16.530184-18.113648-44.618178-19.386339-62.717028-2.841357-18.09885 16.530184-19.386339 44.618178-2.841356 62.717028C847.63448 384.132412 881.967539 472.702825 881.967539 565.239298c0 98.825934-38.476704 191.732376-108.356318 261.61199s-162.786056 108.356318-261.61199 108.356318-191.732376-38.476704-261.61199-108.356318S142.030923 664.065232 142.030923 565.239298s38.476704-191.732376 108.356318-261.61199c53.556612-53.556612 120.639266-88.644407 193.537821-102.126052v71.655462c0 25.439021 29.952634 39.024257 49.087395 22.272092l139.063688-121.763969c13.466846-11.79459 13.466846-32.749595 0-44.529386L493.012457 7.386284C473.877696-9.365881 443.925062 4.219355 443.925062 29.658376v81.807393c-96.694917 14.295575-185.931273 59.002546-256.314044 129.385316C100.964441 327.497663 53.238529 442.705794 53.238529 565.239298s47.725912 237.741635 134.372489 324.388212 201.854709 134.37249 324.388213 134.37249 237.741635-47.725912 324.388213-134.37249 134.37249-201.854709 134.372489-324.388212c0-114.74937-42.590752-224.585562-119.914128-309.263908z"></path></svg>',
      pin: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M930.206 812.172c16.523 0 29.918 13.39 29.918 29.91 0 16.283-13.015 29.527-29.212 29.902l-0.706 0.008H94.794c-16.523 0-29.918-13.391-29.918-29.91 0-16.283 13.015-29.527 29.212-29.902l0.706-0.008h835.412zM577.584 146.059L929.58 538.586a87.467 87.467 0 0 1 22.347 58.396c0 48.299-39.143 87.453-87.43 87.453H160.504a87.416 87.416 0 0 1-58.38-22.352C66.18 629.832 63.179 574.54 95.42 538.586L447.418 146.06a87.441 87.441 0 0 1 6.704-6.706c35.944-32.25 91.22-29.248 123.462 6.706z m-82.956 37.345l-0.563 0.492a27.613 27.613 0 0 0-2.117 2.118L139.95 578.54c-10.181 11.354-9.233 28.814 2.117 38.999a27.605 27.605 0 0 0 18.436 7.059h703.996c15.248 0 27.609-12.365 27.609-27.617a27.621 27.621 0 0 0-7.057-18.44L533.053 186.013c-10.014-11.168-27.067-12.268-38.425-2.61z"></path></svg>',
      warning: '<svg viewBox="0 0 1026 1024" aria-hidden="true"><path d="M1004.657 801.716 602.263 91.599c-49.213-86.817-129.646-86.817-178.866 0L21.004 801.716c-49.207 86.906-8.949 157.798 89.388 157.798h804.877c98.337 0 138.556-70.892 89.388-157.798zM544.635 832.216h-63.649v-63.649h63.649v63.649zM544.635 641.27h-63.649V259.377h63.649V641.27z"></path></svg>',
      copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="6.5" r="2.5"></circle><path d="M8.5 8.2 19 20"></path><path d="M15.5 8.2 5 20"></path><path d="M10 13h4"></path></svg>',
      back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6 9 12l6 6"></path><path d="M10 12h9"></path></svg>',
      batchExcel: '<svg viewBox="0 0 179 191.5" aria-hidden="true"><path d="m80.29,191.5c-.37,0-.75-.04-1.13-.12l-56.04-12.38-.38-.02C10,178.45.01,168.04,0,155.29V36.2C.01,23.45,10.01,13.04,22.75,12.52l.37-.02L79.19.12c.36-.08.74-.12,1.11-.12,13.05.01,23.68,10.65,23.7,23.7v144.09c-.01,13.05-10.65,23.69-23.7,23.7ZM24.81,22.63c-.36.08-.73.12-1.11.12-7.41,0-13.45,6.03-13.45,13.45v119.09c0,7.42,6.03,13.46,13.45,13.46.37,0,.75.04,1.13.12l56.05,12.38.67-.06c6.95-.66,12.19-6.42,12.2-13.4V23.7c0-7-5.25-12.75-12.21-13.4l-.66-.06-56.07,12.39Zm111.57,152.73c-2.83,0-5.12-2.3-5.12-5.12V21.27c0-2.82,2.3-5.12,5.12-5.12s5.12,2.3,5.12,5.12v148.96c0,1.37-.53,2.66-1.5,3.63-.97.97-2.25,1.5-3.62,1.5h0Zm37.5-18.23c-2.83,0-5.12-2.3-5.12-5.12V39.5c0-2.82,2.3-5.12,5.12-5.12s5.12,2.3,5.12,5.12v112.5c0,2.83-2.3,5.12-5.12,5.12Zm-133.86-16.67c-2.82,0-5.12-2.3-5.12-5.12s2.3-5.12,5.12-5.12h23.96c2.83,0,5.12,2.3,5.13,5.12,0,2.83-2.3,5.12-5.12,5.12h-23.96Zm0-39.58c-2.82,0-5.12-2.3-5.12-5.12s2.3-5.12,5.12-5.12h23.96c2.83,0,5.12,2.3,5.13,5.12,0,2.83-2.3,5.12-5.12,5.13h-23.96Zm0-39.58c-2.82,0-5.12-2.3-5.12-5.12s2.3-5.12,5.12-5.12h23.96c2.83,0,5.12,2.3,5.13,5.12,0,1.37-.53,2.66-1.5,3.62s-2.25,1.5-3.62,1.5h-23.96Z"></path></svg>',
      batch: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M464.896 1024c-3.488 0-6.944-0.384-10.368-1.12l-285.184-63.008A143.264 143.264 0 0 1 32 816.864V207.104a143.296 143.296 0 0 1 137.344-143.008L454.528 1.12c3.424-0.736 6.88-1.12 10.368-1.12A143.264 143.264 0 0 1 608 143.104v737.76A143.296 143.296 0 0 1 464.896 1024z m4.352-927.808L185.472 158.88A49.216 49.216 0 0 1 175.104 160C149.152 160 128 181.152 128 207.104v609.76C128 842.88 149.152 864 175.104 864c3.488 0 6.944 0.384 10.368 1.12l283.776 62.688A47.2 47.2 0 0 0 512 880.864V143.104c0-24.512-18.816-44.704-42.752-46.912zM752 941.344a48 48 0 0 1-48-48V130.656a48 48 0 1 1 96 0v762.656a48 48 0 0 1-48 48.032zM944 848A48 48 0 0 1 896 800V224a48 48 0 1 1 96 0v576a48 48 0 0 1-48 48z"></path><path d="M381.344 357.344H258.656a48 48 0 1 1 0-96h122.656a48 48 0 1 1 0.032 96zM381.344 560H258.656a48 48 0 1 1 0-96h122.656a48 48 0 1 1 0.032 96zM381.344 762.656H258.656a48 48 0 1 1 0-96h122.656a48 48 0 1 1 0.032 96z"></path></svg>',
      detailDownload: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M760.889 879.125H263.11c-55.623 0-100.885-45.255-100.885-100.885V377.849c0-55.623 42.062-100.885 93.774-100.885h64v59.54h-64c-18.553 0-34.226 18.93-34.226 41.338V778.24c0 22.791 18.546 41.337 41.337 41.337H760.89c22.791 0 41.337-18.546 41.337-41.337V377.849c0-22.407-15.673-41.337-34.226-41.337h-64v-59.541h64c51.705 0 93.774 45.255 93.774 100.885v400.398c0 55.616-45.262 100.871-100.885 100.871z"></path><path d="M680.974 458.517c-10.617-11.577-28.615-12.352-40.185-1.728l-100.345 92.06V137.317c0-15.709-12.736-28.445-28.444-28.445s-28.444 12.736-28.444 28.445v410.097l-95.296-90.31c-11.4-10.81-29.412-10.319-40.207 1.08-10.809 11.406-10.318 29.405 1.081 40.206L492.437 634.19c5.51 5.07 12.71 7.8 19.55 7.8 6.7 0 13.35-2.37 18.58-7.3l148.011-135.8c11.577-10.625 12.36-28.623 1.735-40.2z"></path></svg>',
      download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10"></path><path d="m8 10 4 4 4-4"></path><path d="M5 20h14"></path></svg>',
      box: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8h10v12H7z"></path><path d="M9 8V5h6v3"></path></svg>',
      tag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11 11 4h7v7l-7 7-7-7Z"></path><circle cx="15.5" cy="7.5" r="1"></circle></svg>',
      list: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h10v14H7z"></path><path d="M9 8h6M9 12h6M9 16h4"></path></svg>',
      historyRecord: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M653.9 248.3c-16.8 0-30.4-13.6-30.4-30.4V96.2c0-16.8 13.6-30.4 30.4-30.4 16.8 0 30.4 13.6 30.4 30.4v121.7c0.1 16.8-13.5 30.4-30.4 30.4zM370.1 248.3c-16.8 0-30.4-13.6-30.4-30.4V96.2c0-16.8 13.6-30.4 30.4-30.4 16.8 0 30.4 13.6 30.4 30.4v121.7c0 16.8-13.7 30.4-30.4 30.4zM856.9 370.1H167.1c-16.8 0-30.4-13.6-30.4-30.4 0-16.8 13.6-30.4 30.4-30.4h689.7c16.8 0 30.4 13.6 30.4 30.4 0.1 16.6-13.5 30.4-30.3 30.4zM653.9 755.5H370.1c-16.8 0-30.4-13.6-30.4-30.4 0-16.8 13.6-30.4 30.4-30.4H654c16.8 0 30.4 13.6 30.4 30.4 0 16.8-13.6 30.4-30.5 30.4zM653.9 572.9H370.1c-16.8 0-30.4-13.6-30.4-30.4s13.6-30.4 30.4-30.4H654c16.8 0 30.4 13.6 30.4 30.4s-13.6 30.4-30.5 30.4z"></path><path d="M836.5 958.3h-649c-39.2 0-71-31.9-71-71V197.6c0-39.2 31.9-71 71-71h649.1c39.2 0 71 31.9 71 71v689.7c-0.1 39.1-31.9 71-71.1 71z m-649-770.8c-5.6 0-10.1 4.5-10.1 10.1v689.7c0 5.6 4.5 10.1 10.1 10.1h649.1c5.6 0 10.1-4.5 10.1-10.1V197.6c0-5.6-4.5-10.1-10.1-10.1H187.5z"></path></svg>',
      clearTrash: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M687.6 96.4H336.4v91.2h351.1V96.4zM636.7 398v405.5h-73.9V398h73.9z m-175.5 0v405.5h-73.9V398h73.9z m332.1-119.2H230.7l27.9 648.8h506.7l28-648.8zM696.8 5.1c40.4 0 73.3 35.6 73.9 79.8v102.7h147.8c20.2 0 36.6 17.8 37 39.9v41.2c0 5.5-4 10-9 10.1h-70.1L848 941.6c-1.8 42.9-33.7 76.6-72.6 77.3H249.8c-39 0-71.3-33.4-73.7-76l-0.1-1.3-28.5-662.7H77.7c-5 0-9.1-4.4-9.2-9.8v-40.9c0-22.2 16.2-40.2 36.3-40.5h148.4V86.2c0-44.3 32.5-80.4 72.7-81.1h370.9z"></path></svg>',
      print: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V4h10v4"></path><path d="M7 17H5V9h14v8h-2"></path><path d="M7 14h10v6H7z"></path></svg>',
      bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9h10l1 11H6L7 9Z"></path><path d="M9 9a3 3 0 0 1 6 0"></path></svg>',
      image: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M778.24 947.2H143.36c-53.248 0-96.256-43.008-96.256-96.256V275.456c0-53.248 43.008-96.256 96.256-96.256h634.88c53.248 0 96.256 43.008 96.256 96.256v575.488c0 53.248-43.008 96.256-96.256 96.256z m-634.88-706.56c-19.456 0-34.816 15.36-34.816 34.816v575.488c0 19.456 15.36 34.816 34.816 34.816h634.88c19.456 0 34.816-15.36 34.816-34.816V275.456c0-19.456-15.36-34.816-34.816-34.816H143.36z"></path><path d="M946.176 844.8c-17.408 0-30.72-13.312-30.72-30.72V244.736c0-58.368-48.128-106.496-106.496-106.496H180.224c-17.408 0-30.72-13.312-30.72-30.72s13.312-30.72 30.72-30.72H808.96c93.184 0 167.936 75.776 167.936 167.936v569.344c0 17.408-13.312 30.72-30.72 30.72z"></path><path d="M77.824 834.56c-11.264 0-21.504-6.144-26.624-16.384-8.192-15.36-2.048-33.792 12.288-41.984l512-276.48c12.288-7.168 27.648-4.096 36.864 6.144L739.328 645.12c11.264 12.288 10.24 31.744-2.048 43.008s-31.744 10.24-43.008-2.048L583.68 565.248 92.16 830.464c-4.096 3.072-9.216 4.096-14.336 4.096zM287.744 547.84c-53.248 0-97.28-44.032-97.28-97.28s44.032-97.28 97.28-97.28 97.28 44.032 97.28 97.28-44.032 97.28-97.28 97.28z m0-133.12c-19.456 0-35.84 16.384-35.84 35.84s16.384 35.84 35.84 35.84 35.84-16.384 35.84-35.84-16.384-35.84-35.84-35.84z"></path></svg>',
      backArrow: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M224.32 505.6a31.936 31.936 0 0 1 10.88-19.84l222.08-222.08a32 32 0 0 1 45.12 45.12l-169.28 169.28H768a32 32 0 0 1 0 64H333.12l169.28 169.28a32 32 0 1 1-45.12 45.44l-224-224a31.968 31.968 0 0 1-8.96-27.2z"></path></svg>',
    };
    return '<span class="pfh-icon pfh-icon-' + escapeHtml(name) + '">' + (icons[name] || '') + '</span>';
  }

  function expandPanel() {
    state.expanded = true;
    state.userCollapsedPanel = false;
    state.manuallyCollapsedForSku = '';
    state.ignoreOutsideClickUntil = Date.now() + 250;
    const panel = ensurePanel();
    panel.style.display = 'block';
    panel.classList.remove('is-collapsed', 'is-hover-resetting');
    window.clearTimeout(state.tooltipSuppressTimer);
    state.tooltipSuppressTimer = window.setTimeout(() => {
      panel.classList.remove('is-tooltip-suppressed');
    }, 260);
    ensureLauncher();
    renderShell();
  }

  function togglePanelVisible() {
    if (isPanelVisible()) collapsePanel(true);
    else expandPanel();
  }

  function stopLauncherEvent(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleLauncherClick(event) {
    stopLauncherEvent(event);
    const now = Date.now();
    if (now < state.launcherSuppressClickUntil) return;
    if (now - state.launcherClickAt < 350) return;
    state.launcherClickAt = now;
    togglePanelVisible();
  }

  function collapsePanel(force) {
    if (!force && window.getSelection && String(window.getSelection()).trim()) return;
    if (!force && state.drawer && state.sku) state.manuallyCollapsedForSku = state.sku;
    state.userCollapsedPanel = true;
    state.expanded = false;
    const panel = ensurePanel();
    panel.classList.add('is-collapsed', 'is-tooltip-suppressed', 'is-hover-resetting');
    suppressPanelTooltips(panel);
    panel.style.display = 'none';
    ensureLauncher();
    renderShell(L.noDrawer);
    resetPanelActionHover(panel);
    window.clearTimeout(state.hoverResetTimer);
    state.hoverResetTimer = window.setTimeout(() => {
      const current = document.getElementById(PANEL_ID);
      if (current) current.classList.remove('is-hover-resetting');
    }, 350);
  }

  function suppressPanelTooltips(scope) {
    const panel = document.getElementById(PANEL_ID);
    const root = panel && scope && panel.contains(scope) ? panel : (panel || scope);
    if (!root) return;
    if (root.classList) root.classList.add('is-tooltip-suppressed');
    if (document.activeElement && root.contains && root.contains(document.activeElement) && document.activeElement.blur) {
      document.activeElement.blur();
    }
    resetPanelActionHover(root);
  }

  function resetPanelActionHover(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('.pfh-header .pfh-actions button').forEach((button) => {
      if (button.blur) button.blur();
      const clone = button.cloneNode(true);
      button.replaceWith(clone);
    });
  }

  function isPanelVisible() {
    const panel = document.getElementById(PANEL_ID);
    return Boolean(panel && panel.style.display !== 'none' && !panel.classList.contains('is-collapsed'));
  }

  function updatePanelPinButton(panel) {
    const button = panel && panel.querySelector('[data-action="panel-close"]');
    if (!button) return;
    button.innerHTML = iconHtml('close') + '<span>' + escapeHtml(L.close) + '</span>';
    button.removeAttribute('title');
    button.setAttribute('aria-label', TOOLTIP.collapse);
    button.setAttribute('data-tooltip', TOOLTIP.collapse);
  }

  function updateSettingsNotice(panel) {
    const button = panel && panel.querySelector('[data-action="about"]');
    if (!button) return;
    button.classList.toggle('has-notice', !state.settings.backgroundNoticeSeen);
  }

  function updateCollectionSwitch(panel) {
    const button = panel && panel.querySelector('.pfh-collection-mark');
    if (!button) return;
    const enabled = Boolean(state.settings.collectionEnabled);
    button.classList.toggle('is-on', enabled);
    button.setAttribute('aria-checked', String(enabled));
    button.title = enabled ? '\u6570\u636e\u91c7\u96c6\u5df2\u5f00\u542f' : '\u6570\u636e\u91c7\u96c6\u5df2\u5173\u95ed';
  }

  function renderShell(statusText) {
    const panel = ensurePanel();
    panel.dataset.view = state.view || 'home';
    const main = panel.querySelector('.pfh-main');
    const isFullView = state.view === 'home' || state.view === 'about' || state.view === 'ledger' || state.view === 'upload';
    if (main) {
      main.classList.toggle('is-home', state.view === 'home');
      main.classList.toggle('is-full', isFullView);
    }
    const scrollSnapshot = capturePanelScroll(panel);
    updatePanelPinButton(panel);
    updateSettingsNotice(panel);
    updateCollectionSwitch(panel);
    renderUploadProgressOverlay(panel);
    renderFirstRunTutorialModal(panel);
    if (state.view === 'home') {
      renderHome(panel, statusText);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'upload') {
      const list = panel.querySelector('.pfh-list');
      if (list) list.innerHTML = '';
    }
    else if (state.view !== 'about' && state.view !== 'ledger') renderSkuList(panel);
    if (state.view === 'about') {
      renderAbout(panel);
      updateSettingsNotice(panel);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'ledger') {
      renderLedger(panel);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'upload') {
      renderUpload(panel);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'sizeImage') {
      renderSizeImage(panel);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    renderDetail(panel, statusText);
    restorePanelScroll(panel, scrollSnapshot);
  }

  function renderUploadProgressOverlay(panel) {
    if (!panel) return;
    const queue = state.uploadQueue || loadUploadQueue();
    const currentUpload = getCurrentRunningUpload(queue);
    const oldInlineOverlay = panel.querySelector('.pfh-upload-progress-pop');
    if (oldInlineOverlay) oldInlineOverlay.remove();
    let overlay = document.getElementById(PANEL_ID + '-upload-progress');
    if (!currentUpload) {
      if (overlay) overlay.remove();
      return;
    }
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = PANEL_ID + '-upload-progress';
      overlay.className = 'pfh-upload-progress-pop';
      document.documentElement.appendChild(overlay);
    }
    const percent = getUploadStepProgress(currentUpload.step);
    overlay.innerHTML = '<div class="pfh-upload-progress-icon">' + iconHtml('upload') + '</div>' +
      '<div class="pfh-upload-progress-main"><strong>' + escapeHtml(currentUpload.sku + '-' + (currentUpload.step || '\u5904\u7406\u4e2d')) + '</strong>' +
      '<div><span style="width:' + percent + '%"></span></div></div>' +
      '<b>' + percent + '%</b>';
    positionUploadProgressOverlay(panel, overlay);
  }

  function positionUploadProgressOverlay(panel, overlay) {
    if (!panel || !overlay) return;
    const rect = panel.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width * 0.58, 220), 320);
    const left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.left + Math.max(0, (rect.width - width) / 2)));
    const aboveTop = rect.top - 54;
    const top = aboveTop >= 12 ? aboveTop : Math.min(window.innerHeight - 50, rect.bottom + 8);
    overlay.style.width = width + 'px';
    overlay.style.left = left + 'px';
    overlay.style.top = Math.max(12, top) + 'px';
    overlay.classList.toggle('is-below', aboveTop < 12);
  }

  function getUploadStepProgress(step) {
    const text = String(step || '');
    if (/\u6253\u5f00\u5546\u54c1|\u51c6\u5907/.test(text)) return 12;
    if (/\u68c0\u67e5\u65e7\u5185\u5bb9|\u6e05\u7406/.test(text)) return 22;
    if (/\u4e0a\u4f20\u63a8\u54c1\u8d44\u6599/.test(text)) return 38;
    if (/\u4e0a\u4f20\u56fe\u5305\u7d20\u6750/.test(text)) return 52;
    if (/\u6279\u91cf\u4e0a\u4f20|\u5339\u914d\u8868\u5355/.test(text)) return 68;
    if (/\u63d0\u5ba1/.test(text)) return 82;
    if (/\u4fdd\u5b58\u8349\u7a3f|\u5173\u95ed/.test(text)) return 92;
    return 18;
  }

  function capturePanelScroll(panel) {
    const selectors = ['.pfh-sku-scroll', '.pfh-detail-scroll', '.pfh-upload-list', '.pfh-ledger-list'];
    return selectors.reduce((snapshot, selector) => {
      const node = panel && panel.querySelector(selector);
      if (node) snapshot[selector] = { top: node.scrollTop, left: node.scrollLeft };
      return snapshot;
    }, {});
  }

  function restorePanelScroll(panel, snapshot) {
    if (!snapshot) return;
    window.requestAnimationFrame(() => {
      Object.keys(snapshot).forEach((selector) => {
        const node = panel && panel.querySelector(selector);
        const pos = snapshot[selector];
        if (!node || !pos) return;
        node.scrollTop = pos.top || 0;
        node.scrollLeft = pos.left || 0;
      });
    });
  }

  function renderAbout(panel) {
    const detail = panel.querySelector('.pfh-detail');
    const cloudBody = '<label class="pfh-cloud-key"><span>' + escapeHtml(L.cloudBackupKey) + '</span><input type="text" class="pfh-cloud-backup-key" value="' + escapeHtml(state.settings.cloudBackupKey || '') + '" placeholder="' + escapeHtml(L.cloudBackupPlaceholder) + '" autocomplete="off" autocapitalize="off" spellcheck="false" data-lpignore="true"></label>' +
      '<div class="pfh-about-actions"><button type="button" data-action="cloud-backup-save">' + escapeHtml(L.cloudBackupSave) + '</button><button type="button" data-action="cloud-backup-restore">' + escapeHtml(L.cloudBackupRestore) + '</button><span class="pfh-cloud-status">' + escapeHtml(getCloudBackupStatusText()) + '</span></div>';
    const preferenceBody = [
      '<div class="pfh-setting-row"><span>' + escapeHtml(L.excelKeywordSetting) + '</span><label><input type="radio" name="pfh-keyword-mode" value="brandName"' + (state.settings.excelKeywordMode === 'brandName' ? ' checked' : '') + '> ' + escapeHtml(L.excelKeywordBrandName) + '</label><label><input type="radio" name="pfh-keyword-mode" value="english"' + (state.settings.excelKeywordMode === 'english' ? ' checked' : '') + '> ' + escapeHtml(L.excelKeywordEnglish) + '</label></div>',
      '<div class="pfh-setting-row"><span>' + escapeHtml(L.excelDownloadSetting) + '</span><label><input type="radio" name="pfh-download-mode" value="picker"' + (state.settings.excelDownloadMode === 'picker' ? ' checked' : '') + '> ' + escapeHtml(L.excelDownloadPicker) + '</label><label><input type="radio" name="pfh-download-mode" value="direct"' + (state.settings.excelDownloadMode === 'direct' ? ' checked' : '') + '> ' + escapeHtml(L.excelDownloadDirect) + '</label></div>',
    ].join('');
    const cacheBody = '<div class="pfh-about-actions"><button type="button" data-action="export-cache">' + escapeHtml(L.exportCache) + '</button><button type="button" data-action="import-cache">' + escapeHtml(L.importCache) + '</button></div>';
    detail.innerHTML = [
      '<div class="pfh-detail-scroll"><section class="pfh-section pfh-about-section pfh-settings-page">',
      '<div class="pfh-settings-hero"><div><h3 data-action="developer-settings-tap">' + escapeHtml(L.settingsTitle) + '</h3><p>\u4e91\u5907\u4efd\u3001\u8fd0\u884c\u504f\u597d\u548c\u8c03\u8bd5\u8bb0\u5f55</p></div><span>v' + escapeHtml(SCRIPT_VERSION) + ' / ' + escapeHtml(String(state.index.length)) + ' \u4e2a\u7f16\u7801</span></div>',
      '<div class="pfh-cloud-backup pfh-settings-card"><div class="pfh-settings-card-head"><strong>' + escapeHtml(L.cloudBackupTitle) + '</strong><span>\u4f18\u5148</span></div>' + cloudBody + '</div>',
      state.developerInsightsUnlocked ? renderInsightsSection() : '',
      renderLogSection(),
      '<div class="pfh-settings-card"><div class="pfh-settings-card-head"><strong>\u5bfc\u51fa\u504f\u597d</strong><span>Excel</span></div>' + preferenceBody + '</div>',
      '<div class="pfh-settings-card"><div class="pfh-settings-card-head"><strong>\u672c\u5730\u7f13\u5b58</strong><span>\u5907\u4efd\u8fc1\u79fb</span></div>' + cacheBody + '</div>',
      state.developerToolsOpen ? renderDeveloperTools() : '',
      '</section></div>',
    ].join('');
  }

  function renderFirstRunTutorialModal(panel) {
    const existing = panel.querySelector('.pfh-first-run-backdrop');
    if (existing) existing.remove();
    if (!state.tutorialModalOpen) return;
    const overlay = document.createElement('div');
    overlay.className = 'pfh-first-run-backdrop';
    overlay.innerHTML = '<section class="pfh-first-run-dialog" role="dialog" aria-modal="true" aria-label="\u4f7f\u7528\u5f15\u5bfc">' +
      '<div class="pfh-first-run-head"><strong>\u6b22\u8fce\u4f7f\u7528 PLM \u60ac\u6d6e\u52a9\u624b</strong><span>\u9996\u6b21\u5f15\u5bfc</span></div>' +
      '<ol>' +
        '<li><b>1</b><p>\u6253\u5f00\u4efb\u610f\u4ea7\u54c1\u8be6\u60c5\u9875\uff0c\u6b63\u5f0f\u542f\u52a8\u7a0b\u5e8f\u3002</p></li>' +
        '<li><b>2</b><p>\u62d6\u52a8\u7a97\u53e3\u8c03\u6574\u5230\u5408\u9002\u4f4d\u7f6e\uff0c\u8ba9\u5b83\u4fdd\u6301\u8212\u670d\u7684\u5de5\u4f5c\u59ff\u52bf\u3002</p></li>' +
        '<li><b>3</b><div><p>\u5728\u6d4f\u89c8\u5668\u5c5e\u6027\u300c\u76ee\u6807\u300d\u680f\u672b\u5c3e\u6dfb\u52a0\u53c2\u6570\uff1a</p><code>--disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding</code><p>\u907f\u514d\u6d4f\u89c8\u5668\u9000\u5230\u540e\u53f0\u540e\u6682\u505c\u4efb\u52a1\uff0c\u8ba9\u81ea\u52a8\u4e0a\u4f20\u5b89\u9759\u5730\u7ee7\u7eed\u5de5\u4f5c\u3002</p></div></li>' +
        '<li><b>4</b><div><p>\u5148\u8bbe\u7f6e\u4e00\u4e32\u4ec5\u4f60\u77e5\u9053\u7684\u4e91\u5907\u4efd\u5bc6\u94a5\uff08\u81f3\u5c11 4 \u4f4d\uff09\u3002\u5b83\u7528\u6765\u533a\u5206\u548c\u627e\u56de\u4f60\u81ea\u5df1\u7684\u5907\u4efd\u3002</p><label class="pfh-tutorial-key"><span>\u5907\u4efd\u5bc6\u94a5</span><input type="text" class="pfh-tutorial-cloud-key" value="' + escapeHtml(state.settings.cloudBackupKey || '') + '" placeholder="\u8bf7\u8f93\u5165\u81f3\u5c11 4 \u4f4d\u5bc6\u94a5" minlength="4" autocomplete="off" autocapitalize="off" spellcheck="false" data-lpignore="true"></label></div></li>' +
      '</ol>' +
      '<button type="button" data-action="first-run-tutorial-done"' + (getCloudBackupKey().length >= 4 ? '' : ' disabled') + '>\u5f00\u59cb\u4f7f\u7528</button>' +
    '</section>';
    panel.appendChild(overlay);
  }

  function renderDeveloperTools() {
    return '<div class="pfh-developer-backdrop" data-action="developer-tools-close">' +
      '<section class="pfh-developer-dialog" role="dialog" aria-modal="true" aria-label="开发者工具">' +
        '<div><strong>开发者工具</strong><span>当前布局</span></div>' +
        '<p>复制窗口、唤起按钮、尺寸和左右分隔栏数据，用于设定新用户首次打开时的默认布局。</p>' +
        '<button type="button" data-action="developer-layout-copy">复制当前布局</button>' +
        '<button type="button" data-action="developer-tools-close">关闭</button>' +
      '</section>' +
    '</div>';
  }

  function renderInsightsSection() {
    const insights = state.insights || emptyInsights();
    const priceCount = Array.isArray(insights.priceHistory) ? insights.priceHistory.length : 0;
    const issueCount = Array.isArray(insights.dataIssues) ? insights.dataIssues.length : 0;
    const typeCount = insights.typeStats && typeof insights.typeStats === 'object' ? Object.keys(insights.typeStats).length : 0;
    const summary = priceCount || issueCount || typeCount
      ? '\u4ef7\u683c ' + priceCount + '\u6761 / \u5f02\u5e38 ' + issueCount + '\u6761 / \u7c7b\u578b ' + typeCount + '\u7c7b'
      : L.insightsEmpty;
    const cloudStatus = state.insightCloudStatus ? '<p class="pfh-insight-status">' + escapeHtml(state.insightCloudStatus) + '</p>' : '';
    return '<div class="pfh-log-panel pfh-insights-panel pfh-settings-card"><div class="pfh-log-head"><strong>' + escapeHtml(L.insightsTitle) + '</strong><span>' + escapeHtml(summary) + '</span></div>' + renderInsightAiModelPicker() + '<div class="pfh-about-actions"><button type="button" data-action="insights-readiness">\u4f53\u68c0</button><button type="button" data-action="tips-manage">' + escapeHtml(L.loadingTipsManage) + '</button><button type="button" data-action="insights-cloud-summary">' + escapeHtml(L.insightsCloudSummary) + '</button><button type="button" data-action="insights-ai-classify">\u0041\u0049\u603b\u7ed3\u89c4\u5219</button><button type="button" data-action="insights-apply-classify">\u91cd\u65b0\u5e94\u7528\u89c4\u5219</button><button type="button" data-action="insights-view-classify">\u67e5\u770b\u89c4\u5219</button><button type="button" data-action="insights-refresh-rules">\u5237\u65b0\u89c4\u5219</button><button type="button" data-action="insights-check-ai">' + escapeHtml(L.insightsCheckAi) + '</button><button type="button" data-action="insights-copy-ai">' + escapeHtml(L.insightsCopyAi) + '</button><button type="button" data-action="insights-copy-rules">' + escapeHtml(L.insightsCopyRules) + '</button><button type="button" data-action="insights-copy-report">' + escapeHtml(L.insightsCopyReport) + '</button><button type="button" data-action="export-insights">' + escapeHtml(L.insightsExport) + '</button><button type="button" data-action="clear-insights">' + escapeHtml(L.insightsClear) + '</button></div>' + cloudStatus + renderInsightReadinessPanel() + renderClassificationRulesPanel() + renderMaintainedCleaningRules() + '</div>';
  }

  function renderInsightAiModelPicker() {
    const current = getInsightAiModelSetting();
    return '<div class="pfh-setting-row pfh-ai-model-row"><span>' + escapeHtml(L.insightsAiModel) + '</span>' +
      '<label><input type="radio" name="pfh-ai-model" value="glm-4.7-flash"' + (current === 'glm-4.7-flash' ? ' checked' : '') + '> GLM-4.7-Flash</label>' +
      '<label><input type="radio" name="pfh-ai-model" value="gemini-3.5-flash"' + (current === 'gemini-3.5-flash' ? ' checked' : '') + '> Gemini-3.5-Flash</label>' +
      '</div>';
  }

  function renderClassificationRulesPanel() {
    const rules = Array.isArray(state.classificationRules) ? state.classificationRules : [];
    if (!rules.length) return '';
    const categoryCount = rules.filter((rule) => rule.kind === 'category').length;
    const packageCount = rules.filter((rule) => rule.kind === 'packageType').length;
    const rows = rules.slice(0, 10).map((rule) => {
      const keywords = Array.isArray(rule.keywords) ? rule.keywords.slice(0, 8).join(' / ') : '';
      return '<div class="pfh-rule-mini"><b>' + escapeHtml((rule.kind === 'packageType' ? '\u5305\u6750 ' : '\u54c1\u7c7b ') + (rule.label || '')) + '</b><small>' + escapeHtml(keywords) + '</small></div>';
    }).join('');
    return '<div class="pfh-rule-maintenance-summary"><strong>\u5546\u54c1\u5206\u7c7b\u89c4\u5219</strong><span>\u54c1\u7c7b ' + categoryCount + ' / \u5305\u6750 ' + packageCount + '</span>' + rows + '</div>';
  }

  function renderInsightReadinessPanel() {
    const data = state.insightReadiness;
    if (!data) return '';
    const checks = Array.isArray(data.checks) ? data.checks : [];
    const passed = checks.filter((item) => item.ok).length;
    const summary = (data.ready ? '\u5df2\u5c31\u7eea' : '\u672a\u5c31\u7eea') + ' / ' + passed + '/' + checks.length;
    const rows = checks.length ? checks.map((item) => {
      const ok = item.ok ? ' is-ok' : ' is-bad';
      return '<div class="pfh-readiness-row' + ok + '">' +
        '<span>' + escapeHtml(item.ok ? '\u901a\u8fc7' : '\u672a\u901a\u8fc7') + '</span>' +
        '<b>' + escapeHtml(item.label || item.key || '') + '</b>' +
        '<small>' + escapeHtml(item.detail || '') + '</small>' +
      '</div>';
    }).join('') : '<div class="pfh-empty">\u6682\u65e0\u4f53\u68c0\u7ed3\u679c</div>';
    const blockers = Array.isArray(data.blockers) && data.blockers.length
      ? '<p class="pfh-readiness-blockers">' + escapeHtml(data.blockers.map((item) => (item.label || item.key || '') + '\uff1a' + (item.detail || '')).join(' / ')) + '</p>'
      : '';
    const ruleSummary = renderRuleMaintenanceSummary(data.ruleMaintenance);
    return '<div class="pfh-readiness-panel"><div class="pfh-log-head"><strong>\u4e91\u7aef\u94fe\u8def\u4f53\u68c0</strong><span>' + escapeHtml(summary) + '</span></div>' + rows + blockers + ruleSummary + '</div>';
  }

  function renderRuleMaintenanceSummary(ruleMaintenance) {
    if (!ruleMaintenance || !ruleMaintenance.total) return '';
    const topRules = Array.isArray(ruleMaintenance.topRules) ? ruleMaintenance.topRules : [];
    const status = ruleMaintenance.byStatus && typeof ruleMaintenance.byStatus === 'object'
      ? Object.keys(ruleMaintenance.byStatus).map((key) => key + ' ' + ruleMaintenance.byStatus[key]).join(' / ')
      : '';
    const rows = topRules.length ? topRules.map((rule) => {
      const detail = [rule.priority, rule.status, rule.action, rule.examples ? '例：' + rule.examples : ''].filter(Boolean).join(' / ');
      return '<div class="pfh-rule-mini"><b>' + escapeHtml(rule.field || rule.ruleId || '') + '</b><small>' + escapeHtml(detail) + '</small></div>';
    }).join('') : '';
    return '<div class="pfh-rule-maintenance-summary"><strong>\u89c4\u5219\u7ef4\u62a4\u6458\u8981</strong><span>' + escapeHtml(status || ('\u603b\u6570 ' + ruleMaintenance.total)) + '</span>' + rows + '</div>';
  }

  function renderMaintainedCleaningRules() {
    const rules = Array.isArray(state.maintainedCleaningRules) ? state.maintainedCleaningRules.slice(0, 8) : [];
    if (!state.maintainedCleaningRulesLoaded) {
      return '<div class="pfh-rule-panel"><div class="pfh-log-head"><strong>\u4e91\u7aef\u6e05\u6d17\u89c4\u5219</strong><span>\u672a\u52a0\u8f7d</span></div><div class="pfh-empty">\u70b9\u51fb\u201c\u5237\u65b0\u89c4\u5219\u201d\u67e5\u770b\u53ef\u7ef4\u62a4\u7684\u89c4\u5219\u72b6\u6001</div></div>';
    }
    if (!rules.length) {
      return '<div class="pfh-rule-panel"><div class="pfh-log-head"><strong>\u4e91\u7aef\u6e05\u6d17\u89c4\u5219</strong><span>0</span></div><div class="pfh-empty">\u6682\u65e0\u89c4\u5219</div></div>';
    }
    const rows = rules.map((rule) => {
      const status = rule.maintenanceStatus || rule.computedMaintenanceStatus || '\u5f85\u590d\u6838';
      const detail = [rule.actionLabel, rule.reason].filter(Boolean).join(' / ');
      const diagnostic = formatMaintainedRuleDiagnostic(rule);
      return '<div class="pfh-rule-row">' +
        '<div><b>' + escapeHtml(rule.priority || 'P3') + ' ' + escapeHtml(rule.missingField || rule.ruleId || '') + '</b><small>' + escapeHtml(detail || rule.ruleId || '') + '</small></div>' +
        '<span>' + escapeHtml(status) + '</span>' +
        (diagnostic ? '<p>' + escapeHtml(diagnostic) + '</p>' : '') +
        '<div class="pfh-rule-actions">' +
          '<button type="button" data-action="insights-rule-auto" data-rule-id="' + escapeHtml(rule.ruleId || '') + '">\u81ea\u52a8</button>' +
          '<button type="button" data-action="insights-rule-done" data-rule-id="' + escapeHtml(rule.ruleId || '') + '">\u5df2\u5904\u7406</button>' +
          '<button type="button" data-action="insights-rule-ignore" data-rule-id="' + escapeHtml(rule.ruleId || '') + '">\u5ffd\u7565</button>' +
        '</div>' +
      '</div>';
    }).join('');
    return '<div class="pfh-rule-panel"><div class="pfh-log-head"><strong>\u4e91\u7aef\u6e05\u6d17\u89c4\u5219</strong><span>' + escapeHtml(String(state.maintainedCleaningRules.length)) + '</span></div><div class="pfh-rule-list">' + rows + '</div></div>';
  }

  function formatMaintainedRuleDiagnostic(rule) {
    if (!rule) return '';
    const parts = [];
    if (Number(rule.count || 0)) parts.push('\u6b21\u6570 ' + rule.count);
    if (rule.likelyPlmEmpty) parts.push('PLM\u7a7a\u503c');
    const kinds = Array.isArray(rule.issueKinds) ? rule.issueKinds.slice(0, 3).filter(Boolean).join('/') : '';
    if (kinds) parts.push(kinds);
    const examples = Array.isArray(rule.examples) ? rule.examples.slice(0, 2).filter(Boolean).join(' / ') : '';
    if (examples) parts.push('\u4f8b\u5b50 ' + examples);
    return parts.join(' | ');
  }

  function renderLogSection() {
    const logs = (state.logs || []).slice(0, 80);
    const rows = logs.length ? logs.map((item) => {
      const level = item.level || 'info';
      return '<div class="pfh-log-row is-' + escapeHtml(level) + '"><span>' + escapeHtml(item.time || '') + '</span><b>' + escapeHtml(level.toUpperCase()) + '</b><p>' + escapeHtml(item.message || '') + '</p></div>';
    }).join('') : '<div class="pfh-empty">' + escapeHtml(L.logEmpty) + '</div>';
    return '<div class="pfh-log-panel"><div class="pfh-log-head"><strong>' + escapeHtml(L.logTitle) + '</strong><span>' + escapeHtml(String((state.logs || []).length)) + '</span></div><div class="pfh-about-actions"><button type="button" data-action="copy-logs">' + escapeHtml(L.logCopy) + '</button><button type="button" data-action="clear-logs">' + escapeHtml(L.logClear) + '</button></div><div class="pfh-log-list">' + rows + '</div></div>';
  }

  function renderUpload(panel) {
    const detail = panel.querySelector('.pfh-detail');
    detail.classList.remove('is-loading');
    detail.innerHTML = uploadPanelHtml();
  }

  function renderUploadSidebar(panel) {
    const list = panel.querySelector('.pfh-list');
    if (!list) return;
    const historyLabel = state.uploadView === 'history' ? L.uploadQueueView : L.uploadHistory;
    list.innerHTML = '<div class="pfh-upload-side">' +
      '<button type="button" class="pfh-upload-side-card" data-action="upload-history-toggle">' + iconHtml('historyRecord') + '<strong>' + escapeHtml(historyLabel) + '</strong><span>' + escapeHtml(state.uploadView === 'history' ? '\u8fd4\u56de\u5f85\u4e0a\u4f20\u961f\u5217' : '\u67e5\u770b\u5df2\u5b8c\u6210\u548c\u5f02\u5e38\u8bb0\u5f55') + '</span></button>' +
      '<button type="button" class="pfh-upload-side-card" data-action="upload-clear-list">' + iconHtml('clearTrash') + '<strong>' + escapeHtml(L.uploadClearList) + '</strong><span>' + escapeHtml('\u6e05\u7406\u5f53\u524d\u5217\u8868\u9879') + '</span></button>' +
      '<article class="pfh-upload-guide"><b>\u4f7f\u7528\u8bf4\u660e</b><p>\u628a xlsx \u548c zip \u4e00\u8d77\u62d6\u5165\u53f3\u4fa7\uff0c\u811a\u672c\u4f1a\u6309\u6587\u4ef6\u540d\u91cc\u7684 SKU \u81ea\u52a8\u914d\u5bf9\u3002</p><p>\u4e24\u4e2a\u6587\u4ef6\u90fd\u9f50\u5168\u540e\u624d\u4f1a\u5165\u961f\u4e0a\u4f20\uff1b\u5df2\u6709\u5185\u5bb9\u7684\u4ea7\u54c1\u9700\u52fe\u9009\u91cd\u8bd5\u540e\u624d\u4f1a\u6e05\u7406\u91cd\u4f20\u3002</p></article>' +
      '</div>';
  }

  function renderSkuList(panel) {
    const list = panel.querySelector('.pfh-list');
    const query = state.searchQuery.trim();
    const searchTokens = parseSearchTokens(query);
    const allItems = getSearchMatches(searchTokens);
    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(allItems.length / pageSize));
    state.skuPage = clamp(state.skuPage || 1, 1, totalPages);
    const items = allItems.slice((state.skuPage - 1) * pageSize, state.skuPage * pageSize);
    const listTitle = state.view === 'sizeImage' ? '\u5c3a\u5bf8\u56fe SKU' : 'SKU\u5217\u8868';
    const listHead = '<div class="pfh-list-head"><button type="button" data-action="home-back" aria-label="\u8fd4\u56de\u4e3b\u9875">' + iconHtml('backArrow') + '</button><strong>' + listTitle + '</strong><span>\u5171 ' + allItems.length + ' \u6761</span></div>';
    const pager = '<div class="pfh-list-pager"><div><button type="button" data-action="sku-page-prev"' + (state.skuPage <= 1 ? ' disabled' : '') + '>\u2039</button>' + renderCompactPager('sku-page', state.skuPage, totalPages) + '<button type="button" data-action="sku-page-next"' + (state.skuPage >= totalPages ? ' disabled' : '') + '>\u203a</button></div></div>';
    if (!allItems.length) {
      list.innerHTML = listHead + '<div class="pfh-sku-scroll"><div class="pfh-empty">' + escapeHtml(searchTokens.length ? L.noSearchResult : L.emptyList) + '</div></div>' + pager;
      return;
    }
    const searchToolbar = searchTokens.length
      ? '<div class="pfh-search-result-toolbar"><button type="button" data-action="pin-search-results">全部置顶</button><span>' + escapeHtml(L.searchResult + ': ' + allItems.length) + '</span></div>'
      : '';
    list.innerHTML = listHead + '<div class="pfh-sku-scroll">' + searchToolbar + items.map((item) => {
      const active = item.sku === state.selectedSku ? ' is-active' : '';
      const pinned = item.pinned ? ' is-pinned' : '';
      const title = [item.brand, item.name, item.sku].filter(Boolean).join(' ');
      const pinTitle = item.pinned ? TOOLTIP.unpin : TOOLTIP.pin;
      const pinControl = active ? '<em data-pin-sku="' + escapeHtml(item.sku) + '" title="' + escapeHtml(pinTitle) + '">' + iconHtml('pin') + '</em>' : '';
      return '<button type="button" class="pfh-sku' + active + pinned + '" data-sku="' + escapeHtml(item.sku) + '" title="' + escapeHtml(title) + '">' +
        '<span><b>' + escapeHtml(item.sku) + '</b>' + pinControl + '</span>' +
        ([item.brand, item.name].filter(Boolean).join(' ') ? '<small>' + escapeHtml([item.brand, item.name].filter(Boolean).join(' ')) + '</small>' : '') +
        '</button>';
    }).join('') + '</div>' + pager;
  }

  function renderHome(panel, statusText) {
    const list = panel.querySelector('.pfh-list');
    const detail = panel.querySelector('.pfh-detail');
    const first = state.index[0] ? normalizeData(loadData(state.index[0].sku) || state.index[0]) : null;
    if (list) list.innerHTML = '';
    detail.classList.remove('is-loading');
    detail.innerHTML = homeViewHtml(statusText, first);
  }

  function renderSizeImage(panel) {
    const detail = panel.querySelector('.pfh-detail');
    detail.classList.remove('is-loading');
    detail.innerHTML = sizeImageViewHtml();
  }

  function renderLedger(panel) {
    const list = panel.querySelector('.pfh-list');
    const detail = panel.querySelector('.pfh-detail');
    const records = getLedgerRecordsForMonth(state.ledgerView, getCurrentLedgerMonth());
    if (list) list.innerHTML = '';
    detail.classList.remove('is-loading');
    detail.innerHTML = ledgerViewHtml(records);
  }

  function renderDetail(panel, statusText) {
    const detail = panel.querySelector('.pfh-detail');
    const data = state.data || (state.selectedSku ? loadData(state.selectedSku) : null);
    const loading = state.scanRunning || state.copywritingLoading || statusText === L.scanning || statusText === L.checkingMaterial;
    detail.classList.toggle('is-loading', loading);
    if (!data) {
      if (loading) {
        const main = panel.querySelector('.pfh-main');
        if (main) main.classList.remove('is-home');
        detail.innerHTML = renderStatusHtml(statusText) + '<div class="pfh-detail-scroll"></div>';
      } else {
        detail.innerHTML = homeViewHtml(statusText, null);
      }
      return;
    }
    state.data = normalizeData(data);
    if (!state.copywritingMode) {
      scheduleProductThumbHydration(state.data);
      scheduleInsightRecommendation(state.data);
    }
    const main = panel.querySelector('.pfh-main');
    if (main) main.classList.remove('is-home');
    if (state.copywritingMode) {
      detail.innerHTML = [
        '<div class="pfh-detail-scroll pfh-copywriting-scroll">',
        productHeroSectionHtml(state.data, true),
        copywritingViewHtml(state.data),
        '</div>',
      ].join('');
      return;
    }
    detail.innerHTML = [
      renderStatusHtml(statusText),
      '<div class="pfh-detail-scroll">',
      productHeroSectionHtml(state.data, false),
      '<div class="pfh-info-grid">',
      rowHtml('packageCode', L.packageCode, state.data.packageCode),
      rowHtml('printCode', L.printCode, state.data.printCode),
      rowHtml('packageSizeText', state.data.packageSizeLabel || L.packageSize, state.data.packageSizeText || L.noPackage),
      rowHtml('printSizeText', state.data.printSizeLabel || L.printSize, formatPrintSizeDisplay(state.data) || L.noPrint),
      '</div>',
      '</section>',
      '<section class="pfh-section pfh-graphic-section"><div class="pfh-section-title pfh-graphic-title"><h3>' + escapeHtml(L.graphicSection) + '</h3>' + excelTriggerHtml() + '</div><div class="pfh-excel-options-row">' + excelOptionsHtml() + '</div>',
      '<div class="pfh-graphic-table pfh-info-grid">',
      rowHtml('packageLength', L.cartonLength, state.data.packageLength || L.noDimension),
      rowHtml('productLength', state.data.isTubePrint ? L.tailSealLength : L.productLength, state.data.isTubePrint ? (state.data.productLength || L.noDimension) : (state.data.productLength || L.noDimension), { editable: state.data.isTubePrint }),
      rowHtml('packageWidth', L.cartonWidth, state.data.packageWidth || L.noDimension),
      rowHtml('productWidth', L.productWidth, state.data.productWidth || L.noDimension),
      rowHtml('packageHeight', L.cartonHeight, state.data.packageHeight || L.noDimension),
      rowHtml('productHeight', L.productHeight, state.data.productHeight || L.noDimension),
      rowHtml('netContent', L.netContent, state.data.netContent || L.unknown),
      rowHtml('grossWeight', L.grossWeight, state.data.grossWeight || L.unknown),
      '</div>' + insightRecommendationHtml(state.data) + '</section>',
      '</div>',
      '<div class="pfh-note"><span class="pfh-note-source">' + escapeHtml(state.data.updatedAt ? (L.updatedAt + ': ' + state.data.updatedAt) : '') + '</span><span class="pfh-note-toast" aria-live="polite"></span><button type="button" data-action="refresh" title="' + escapeHtml(TOOLTIP.refresh) + '">' + iconHtml('refresh') + '</button></div>',
    ].join('');
  }

  function productHeroSectionHtml(data, copywritingMode) {
    const title = [data && data.brand, data && data.name].filter(Boolean).join(' ') || formatTitleMeta(data) || L.noDrawer;
    const actions = copywritingMode
      ? '<div class="pfh-copywriting-hero-actions">' +
          '<button type="button" data-action="copywriting-back">返回数据</button>' +
          '<button type="button" data-action="copywriting-copy">复制全文</button>' +
          '<button type="button" data-action="copywriting-refresh">重新获取</button>' +
          ((data && data.copywriting && data.copywriting.updatePending) ? '<button type="button" data-action="copywriting-ack">已查看更新</button>' : '') +
        '</div>'
      : '<button type="button" class="pfh-title-open-detail" data-action="open-detail">打开详情</button>';
    return '<section class="pfh-section pfh-file-section' + (copywritingMode ? ' pfh-copywriting-hero-section' : '') + '"><div class="pfh-product-hero"><div class="pfh-title-meta" title="' + escapeHtml(L.copyHint) + '">' +
      productThumbHtml(data) +
      '<div class="pfh-product-title-copy"><span data-action="copy-sku">' + escapeHtml((data && data.sku) || L.sku) + '</span><strong data-action="copy-title-meta">' + escapeHtml(title) + '</strong>' + actions + '</div>' +
      '</div></div>' + (copywritingMode ? '</section>' : '');
  }

  function copywritingViewHtml(data) {
    const record = normalizeCopywritingRecord(data && data.copywriting);
    if (state.copywritingLoading) {
      return '<section class="pfh-copywriting-page is-loading"><div class="pfh-copywriting-empty"><span class="pfh-copywriting-spinner"></span><strong>正在读取产品文案</strong><p>' + escapeHtml(state.copywritingStatus || '正在定位设计资料里的 Word 附件...') + '</p></div></section>';
    }
    const errorHtml = state.copywritingError
      ? '<div class="pfh-copywriting-alert is-error"><strong>文案读取未完成</strong><span>' + escapeHtml(state.copywritingError) + '</span></div>'
      : '';
    if (!record || !record.fullText) {
      return '<section class="pfh-copywriting-page">' + errorHtml + '<div class="pfh-copywriting-empty"><strong>还没有可展示的文案</strong><p>点击重新获取后，脚本会读取设计资料里的产品文案 Word。</p></div></section>';
    }
    const changed = new Set(record.changedSectionKeys || []);
    const updateHtml = record.updatePending
      ? '<div class="pfh-copywriting-alert is-update"><strong>文案已更新</strong><span>' + escapeHtml(formatCopywritingUpdateSummary(record)) + '</span></div>'
      : '';
    const missingHtml = record.missingSections && record.missingSections.length
      ? '<div class="pfh-copywriting-alert is-warning"><strong>部分字段缺失</strong><span>' + escapeHtml(record.missingSections.join('、')) + '</span></div>'
      : '';
    const sectionsHtml = record.sections.map((section) => {
      return '<div class="pfh-copywriting-block' + (changed.has(section.key) ? ' is-changed' : '') + '" data-copywriting-key="' + escapeHtml(section.key) + '">' +
        '<div class="pfh-copywriting-block-head"><span>' + escapeHtml(section.label || section.key) + '</span><button type="button" data-action="copywriting-section-copy" data-copywriting-key="' + escapeHtml(section.key) + '">复制本段</button></div>' +
        '<pre>' + escapeHtml(section.text) + '</pre></div>';
    }).join('');
    return '<section class="pfh-copywriting-page">' + errorHtml + updateHtml + missingHtml + '<div class="pfh-copywriting-content">' + sectionsHtml + '</div></section>';
  }

  function copywritingSectionCopyValue(section) {
    if (!section || !section.text) return '';
    const lines = String(section.text).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return '';
    const first = lines[0] || '';
    if (/^(?:DISTRIBUTED BY|ADDRESS|EU REP|UK REP|US REP)$/i.test(first)) return lines.slice(1).join('\n');
    const inlineHeading = first.match(/^\s*[A-Z][A-Z0-9 /().-]*\s*[:\uff1a]\s*(.*)$/);
    if (!inlineHeading) return lines.join('\n');
    const body = lines.slice(1);
    if (inlineHeading[1]) body.unshift(inlineHeading[1].trim());
    return body.filter(Boolean).join('\n');
  }

  function formatCopywritingUpdateSummary(record) {
    const changedCount = (record.changedSectionKeys || []).length;
    const removed = record.removedSections || [];
    const parts = [];
    if (changedCount) parts.push(changedCount + ' 段有变化');
    if (removed.length) parts.push('删除：' + removed.join('、'));
    return parts.join('；') || '检测到新的产品文案文件';
  }

  function homeViewHtml(statusText) {
    const count = state.index.length;
    const status = statusText || '打开项目后，我会自动沉淀尺寸、净含量、重量与图包信息。';
    const sizeImageLocked = !state.sizeImageAccessEnabled;
    const sizeImageLockText = state.sizeImageAccessLoading ? '正在核对使用权限。' : '当前使用人未开通此功能。';
    const cards = [
      ['open-first-detail', 'folder', '我的详情', '打开我的详情', '默认打开第一个编码的详情页。'],
      ['ledger-open', 'taskPlan', '今日台账', '今日工作台', '记录定稿和粗流程，一键复制到月登记表。'],
      ['home-excel-coming-soon', 'batchExcel', '规格成表', '批量生成 Excel', '把纸盒、标签、净含量与图片整理成可交付表格。', true],
      ['upload-toggle', 'upload', '提审流转', '批量提审上传', '按 SKU 队列上传文件，记录成功、草稿与异常状态。'],
      ['home-size-image', 'image', '包装辅助', '生成尺寸图', sizeImageLocked ? sizeImageLockText : '选择 SKU 并拖入图片，自动识别纸盒或标签并生成 JPG。', sizeImageLocked],
      ['home-download-detail', 'detailDownload', '图像归档', '批量下载详情图', '按主图/详情图分组处理下载流程，减少重复点击。'],
    ];
    return '<div class="pfh-detail-scroll"><section class="pfh-home">' +
      '<div class="pfh-home-orbit"><i class="wave"></i><i class="wave"></i><i class="wave"></i><span></span></div>' +
      '<h2>PLM 工作台</h2>' +
      '<p>' + escapeHtml(status) + '</p>' +
      '<div class="pfh-home-stats"><span>CACHED</span><b>' + escapeHtml(String(count)) + '</b><em>本地产品档案</em></div>' +
      '<div class="pfh-home-grid">' + cards.map((card) => '<button type="button" class="pfh-home-card' + (card[5] ? ' is-disabled' : '') + '" data-action="' + card[0] + '"' + (card[5] ? ' disabled aria-disabled="true"' : '') + '>' +
        iconHtml(card[1]) +
        '<small>' + escapeHtml(card[2]) + '</small>' +
        '<strong>' + escapeHtml(card[3]) + '</strong>' +
        '<span>' + escapeHtml(card[4]) + '</span>' +
      '</button>').join('') + '</div>' +
      '</section></div>';
  }

  function sizeImageViewHtml() {
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) {
      return '<div class="pfh-detail-scroll pfh-size-image-scroll"><section class="pfh-size-image-page"><div class="pfh-size-image-empty"><strong>\u9009\u62e9\u4e00\u4e2a SKU</strong><p>\u4ece\u5de6\u4fa7\u9009\u62e9 SKU \u540e\uff0c\u53ef\u5206\u522b\u751f\u6210\u7eb8\u76d2\u548c\u6807\u7b7e\u5c3a\u5bf8\u56fe\u3002</p></div></section></div>';
    }
    const cartonSpec = getSizeImageSpec(data);
    const labelSpec = getLabelSizeImageSpec(data);
    const session = ensureSizeImageSession(data.sku);
    const busy = state.sizeImageBusySku === data.sku;
    const cartonDimension = cartonSpec ? formatSizeImageNumber(cartonSpec.length) + ' \u00d7 ' + formatSizeImageNumber(cartonSpec.width) + ' \u00d7 ' + formatSizeImageNumber(cartonSpec.height) + ' cm' : '';
    const labelDimension = labelSpec ? formatSizeImageNumber(labelSpec.width) + ' \u00d7 ' + formatSizeImageNumber(labelSpec.height) + ' cm' : '';
    const dimensionText = [cartonDimension ? '\u7eb8\u76d2 ' + cartonDimension : '', labelDimension ? '\u6807\u7b7e ' + labelDimension : ''].filter(Boolean).join(' / ') || '\u5c3a\u5bf8\u4e0d\u53ef\u7528';
    const resultCount = Number(Boolean(session.cartonResultDataUrl)) + Number(Boolean(session.labelResultDataUrl));
    const status = busy
      ? '<div class="pfh-size-image-status is-processing"><i></i><span>' + escapeHtml(session.processingStep || '\u6b63\u5728\u8bfb\u53d6\u56fe\u7247...') + '</span><em></em></div>'
      : session.error
      ? '<div class="pfh-size-image-status is-error">' + escapeHtml(session.error) + '</div>'
      : (resultCount ? '<div class="pfh-size-image-status is-ready">\u5df2\u751f\u6210 ' + resultCount + ' \u4e2a 3000 \u00d7 3000 JPG\u3002</div>' : '');
    const previewCard = (type, url) => {
      const label = type === 'label' ? '\u6807\u7b7e' : '\u7eb8\u76d2';
      return url
        ? '<div class="pfh-size-image-preview"><span class="pfh-size-image-preview-type">' + label + '\u9884\u89c8</span><img src="' + url + '" alt="' + escapeHtml(data.sku + ' ' + label + '\u5c3a\u5bf8\u56fe') + '"></div>'
        : '<div class="pfh-size-image-placeholder is-compact">' + iconHtml(type === 'label' ? 'tag' : 'box') + '<strong>\u6682\u65e0' + label + '\u9884\u89c8</strong><span>\u53ef\u540c\u65f6\u62d6\u5165\u4e24\u5f20\u56fe\u7247</span></div>';
    };
    const preview = '<div class="pfh-size-image-preview-grid">' + previewCard('carton', session.cartonResultDataUrl) + previewCard('label', session.labelResultDataUrl) + '</div>';
    const disabled = (cartonSpec || labelSpec) && !busy ? '' : ' disabled';
    const remarks = getSizeImageRemarks(data);
    if (typeof session.cartonRemarkText !== 'string') session.cartonRemarkText = remarks.carton || '';
    if (typeof session.labelRemarkText !== 'string') session.labelRemarkText = remarks.label || '';
    const remarkInputs = [
      cartonSpec ? '<label><span>\u7eb8\u76d2</span><input type="text" class="pfh-size-image-remark-text" data-size-image-type="carton" value="' + escapeHtml(session.cartonRemarkText) + '" placeholder="\u7eb8\u76d2\u6807\u9898\u5907\u6ce8"></label>' : '',
      labelSpec ? '<label><span>\u6807\u7b7e</span><input type="text" class="pfh-size-image-remark-text" data-size-image-type="label" value="' + escapeHtml(session.labelRemarkText) + '" placeholder="\u6807\u7b7e\u6807\u9898\u5907\u6ce8"></label>' : '',
    ].filter(Boolean).join('');
    return '<div class="pfh-detail-scroll pfh-size-image-scroll"><section class="pfh-size-image-page">' +
      '<header class="pfh-size-image-hero"><div><small>SIZE IMAGE</small><h3>' + escapeHtml(data.sku) + ' \u5c3a\u5bf8\u56fe</h3><p>' + escapeHtml([data.brand, data.name].filter(Boolean).join(' ') || '\u9009\u4e2d\u4ea7\u54c1') + '</p></div></header>' +
      (!(cartonSpec || labelSpec) ? '<div class="pfh-size-image-status is-error">' + escapeHtml(getSizeImageSpecError(data)) + '</div>' : '') +
      '<div class="pfh-size-image-workspace' + (busy ? ' is-busy' : '') + '"><div class="pfh-size-image-controls">' +
        '<div class="pfh-size-image-spec"><span>\u5df2\u8bfb\u53d6\u89c4\u683c</span><b>' + escapeHtml(dimensionText) + '</b><small>\u7eb8\u76d2\u6309\u5200\u6a21\u8f6e\u5ed3\u8bc6\u522b\uff1b\u6807\u7b7e\u6309\u5bbd\u9ad8\u6bd4\u4f8b\u8bc6\u522b\u3002</small></div>' +
        '<div class="pfh-size-image-remark-editor"><span>\u6807\u9898\u5907\u6ce8</span><div>' + remarkInputs + '</div></div>' +
        '<div class="pfh-size-image-options"><label><input type="checkbox" class="pfh-size-image-round-arc-input"' + (session.includeRoundArc === false ? '' : ' checked') + '><span>\u6807\u7b7e\u5706\u5f27</span></label><label><input type="checkbox" class="pfh-size-image-batch-number-input"' + (session.includeBatchNumber === false ? '' : ' checked') + '><span>\u6279\u6b21\u53f7</span></label></div>' +
        '<button type="button" class="pfh-size-image-drop' + (busy ? ' is-processing' : '') + '" data-action="size-image-pick"' + disabled + '>' + (busy ? '<i class="pfh-size-image-spinner"></i>' : iconHtml('upload')) + '<strong>' + (busy ? escapeHtml(session.processingStep || '\u6b63\u5728\u5206\u6790\u5e76\u751f\u6210...') : '\u70b9\u51fb\u9009\u62e9\u6216\u62d6\u5165\u56fe\u7247') + '</strong><span>' + (busy ? '\u8bf7\u7a0d\u5019\uff0c\u5927\u5c3a\u5bf8\u56fe\u7247\u9700\u8981\u51e0\u79d2\u5904\u7406\u65f6\u95f4\u3002' : '\u9f20\u6807\u505c\u5728\u8fd9\u91cc\u53ef\u76f4\u63a5 Ctrl+V \u7c98\u8d34\u56fe\u7247\u3002\u7eb8\u76d2\u7528\u900f\u660e PNG\uff0c\u6807\u7b7e\u652f\u6301 PNG / JPG\u3002') + '</span></button>' +
        (session.fileName ? '<p class="pfh-size-image-file">\u6700\u8fd1\u8bfb\u53d6\uff1a' + escapeHtml(session.fileName) + '</p>' : '') +
        '<div class="pfh-size-image-actions"><button type="button" class="is-primary" data-action="size-image-save-all"' + (resultCount && !busy ? '' : ' disabled') + '>' + iconHtml('download') + '\u53e6\u5b58\u5c3a\u5bf8\u56fe JPG</button></div>' +
        '<input type="file" class="pfh-size-image-file-input" accept="image/png,image/jpeg,.png,.jpg,.jpeg" multiple>' + status +
      '</div>' + preview + '</div>' +
    '</section></div>';
  }

  function ensureSizeImageSession(sku) {
    if (!state.sizeImageSessions[sku]) state.sizeImageSessions[sku] = { includeRemark: true, includeRoundArc: true, includeBatchNumber: true };
    if (typeof state.sizeImageSessions[sku].includeRemark !== 'boolean') state.sizeImageSessions[sku].includeRemark = true;
    if (typeof state.sizeImageSessions[sku].includeRoundArc !== 'boolean') state.sizeImageSessions[sku].includeRoundArc = true;
    if (typeof state.sizeImageSessions[sku].includeBatchNumber !== 'boolean') state.sizeImageSessions[sku].includeBatchNumber = true;
    return state.sizeImageSessions[sku];
  }

  function getSizeImageSpec(data) {
    if (!data || !/\u7eb8\u76d2/.test(String(data.packageSizeLabel || ''))) return null;
    const nums = Array.isArray(data.packageNums) ? data.packageNums.map(Number) : [];
    if (nums.length !== 3 || nums.some((value) => !Number.isFinite(value) || value <= 0)) return null;
    return { length: nums[0], width: nums[1], height: nums[2] };
  }

  function getSizeImageSpecError(data) {
    if (Array.isArray(data && data.packageNums) && data.packageNums.length > 3) return '\u5f53\u524d\u7eb8\u76d2\u542b\u591a\u9875\u5c3a\u5bf8\uff0c\u6682\u4e0d\u652f\u6301\u3002';
    return '\u672a\u627e\u5230\u53ef\u7528\u7684\u7eb8\u76d2\u6216\u6807\u7b7e\u5c3a\u5bf8\uff0c\u8bf7\u5148\u5237\u65b0 PLM \u7f13\u5b58\u3002';
  }

  function getLabelSizeImageSpec(data) {
    if (!data || data.isTubePrint || !/\u6807\u7b7e/.test(String(data.printSizeLabel || ''))) return null;
    const nums = parseDimension(data.printSizeText, 2);
    if (!nums || nums.length < 2) return null;
    const width = Number(nums[0]);
    const height = Number(nums[1]);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
    return { width, height };
  }

  function getSizeImageRemarks(data) {
    const collect = (label, extra) => {
      const values = [];
      const source = String(label || '');
      let match;
      const pattern = /[\uff08(]([^\uff09)]+)[\uff09)]/g;
      while ((match = pattern.exec(source))) {
        const value = cleanCopywritingLine(match[1]);
        if (value && !/\d+(?:\.\d+)?\s*[xX\u00d7*]/.test(value)) values.push(value);
      }
      ['\u5185\u5361', '\u900f\u660e', '\u52a0\u7c98'].forEach((keyword) => {
        if (!source.includes(keyword) || values.some((value) => value.includes(keyword))) return;
        const sourceIndex = source.indexOf(keyword);
        const insertAt = values.findIndex((value) => source.indexOf(value) > sourceIndex);
        if (insertAt >= 0) values.splice(insertAt, 0, keyword);
        else values.push(keyword);
      });
      (extra || []).forEach((value) => { if (value) values.push(value); });
      return Array.from(new Set(values)).join(' ');
    };
    return {
      carton: collect(data && data.packageSizeLabel, [data && data.hasInnerCard ? '\u5185\u5361' : '']),
      label: collect(data && data.printSizeLabel, []),
    };
  }

  function formatSizeImageNumber(value) {
    return trimNumber(Number(value));
  }

  function yieldSizeImageUi() {
    return new Promise((resolve) => window.requestAnimationFrame(() => window.setTimeout(resolve, 0)));
  }

  async function setSizeImageProcessingStep(session, text) {
    session.processingStep = text;
    const panel = document.getElementById(PANEL_ID);
    const strong = panel && panel.querySelector('.pfh-size-image-drop.is-processing strong');
    const status = panel && panel.querySelector('.pfh-size-image-status.is-processing span');
    if (strong) strong.textContent = text;
    if (status) status.textContent = text;
    await yieldSizeImageUi();
  }

  async function processSizeImageFile(file, preferredType, silent) {
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    const cartonSpec = getSizeImageSpec(data);
    const labelSpec = getLabelSizeImageSpec(data);
    if (!data || !data.sku || !(cartonSpec || labelSpec)) {
      showToast(data ? getSizeImageSpecError(data) : '\u8bf7\u5148\u9009\u62e9 SKU');
      return;
    }
    if (!file || !/\.(?:png|jpe?g)$/i.test(file.name || '') || (file.type && !/^image\/(?:png|jpeg)$/.test(file.type))) {
      const invalidSession = ensureSizeImageSession(data.sku);
      invalidSession.fileName = file && file.name || '';
      invalidSession.error = '\u8bf7\u9009\u62e9 PNG \u6216 JPG \u56fe\u7247\uff1b\u7eb8\u76d2\u5fc5\u987b\u4f7f\u7528\u900f\u660e PNG\u3002';
      renderShell();
      return;
    }
    const sku = data.sku;
    const session = ensureSizeImageSession(sku);
    state.sizeImageBusySku = sku;
    session.fileName = file.name;
    session.error = '';
    session.processingStep = '\u6b63\u5728\u8bfb\u53d6 ' + file.name;
    if (!silent) renderShell();
    if (!silent) await yieldSizeImageUi();
    const sourceUrl = URL.createObjectURL(file);
    try {
      const image = await loadSizeImageSource(sourceUrl);
      await setSizeImageProcessingStep(session, '\u6b63\u5728\u8bc6\u522b\u7eb8\u76d2\u6216\u6807\u7b7e...');
      let detectedType = preferredType === 'carton' || preferredType === 'label' ? preferredType : '';
      let geometry = null;
      let cartonError = null;
      if ((!detectedType || detectedType === 'carton') && cartonSpec && /\.png$/i.test(file.name || '')) {
        try {
          geometry = analyzeSizeImageGeometry(image, cartonSpec);
          detectedType = 'carton';
        } catch (error) {
          cartonError = error;
          if (preferredType === 'carton') throw error;
        }
      }
      if (!detectedType || detectedType === 'label') {
        if (!labelSpec) throw cartonError || new Error('\u5f53\u524d SKU \u6ca1\u6709\u53ef\u7528\u7684\u6807\u7b7e\u5c3a\u5bf8\u3002');
        geometry = analyzeLabelSizeImageGeometry(image, labelSpec);
        detectedType = 'label';
      }
      await setSizeImageProcessingStep(session, '\u8bc6\u522b\u5b8c\u6210\uff0c\u6b63\u5728\u7ed8\u5236 3000 \u00d7 3000 JPG...');
      if (detectedType === 'carton') {
        session.cartonResultDataUrl = generateSizeImageJpeg(image, geometry, cartonSpec, data, session.includeRemark, session.includeRoundArc, session.cartonRemarkText);
        session.cartonFile = file;
      } else {
        session.labelResultDataUrl = generateLabelSizeImageJpeg(image, geometry, labelSpec, data, session.includeRemark, session.includeRoundArc, session.includeBatchNumber, session.labelRemarkText);
        session.labelFile = file;
      }
      session.error = '';
      if (!silent) showToast('\u5df2\u81ea\u52a8\u8bc6\u522b\u4e3a' + (detectedType === 'carton' ? '\u7eb8\u76d2' : '\u6807\u7b7e') + '\u5e76\u751f\u6210\u5c3a\u5bf8\u56fe');
    } catch (error) {
      session.error = formatSizeImageError(error);
    } finally {
      URL.revokeObjectURL(sourceUrl);
      if (!silent) {
        if (state.sizeImageBusySku === sku) state.sizeImageBusySku = '';
        session.processingStep = '';
        if (state.view === 'sizeImage') renderShell();
      }
    }
  }

  function loadSizeImageSource(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('\u65e0\u6cd5\u8bfb\u53d6\u56fe\u7247\uff0c\u6587\u4ef6\u53ef\u80fd\u5df2\u635f\u574f\u3002'));
      image.src = url;
    });
  }

  async function processSizeImageFiles(files) {
    const items = Array.from(files || []).filter(Boolean);
    if (!items.length) return;
    const sku = state.selectedSku || (state.data && state.data.sku) || '';
    const session = sku && ensureSizeImageSession(sku);
    if (session) {
      state.sizeImageBusySku = sku;
      session.error = '';
      session.fileName = items.map((file) => file.name).join(' / ');
      session.processingStep = '\u6b63\u5728\u8bfb\u53d6 ' + items.length + ' \u5f20\u56fe\u7247...';
      if (state.view === 'sizeImage') renderShell();
      await yieldSizeImageUi();
    }
    for (const file of items) await processSizeImageFile(file, '', true);
    if (state.sizeImageBusySku === sku) state.sizeImageBusySku = '';
    if (session) session.processingStep = '';
    if (session && !session.error) {
      const names = [session.cartonResultDataUrl ? '\u7eb8\u76d2' : '', session.labelResultDataUrl ? '\u6807\u7b7e' : ''].filter(Boolean).join('\u548c');
      if (names) showToast('\u5df2\u751f\u6210' + names + '\u5c3a\u5bf8\u56fe');
    }
    if (state.view === 'sizeImage') renderShell();
  }

  function analyzeSizeImageGeometry(image, spec) {
    const maxSide = 1800;
    const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const rows = new Array(height);
    let transparentPixels = 0;
    let opaquePixels = 0;
    for (let y = 0; y < height; y += 1) {
      let count = 0;
      let left = width;
      let right = -1;
      for (let x = 0; x < width; x += 1) {
        const alpha = pixels[(y * width + x) * 4 + 3];
        if (alpha <= 12) transparentPixels += 1;
        if (alpha >= 220) opaquePixels += 1;
        if (alpha > 12) {
          count += 1;
          if (left === width) left = x;
          right = x;
        }
      }
      rows[y] = { count, left, right };
    }
    const totalPixels = width * height;
    if (transparentPixels < totalPixels * 0.03 || opaquePixels < totalPixels * 0.05) {
      throw new Error('\u56fe\u7247\u6ca1\u6709\u53ef\u9760\u7684\u900f\u660e\u8f6e\u5ed3\uff0c\u8bf7\u5728 Photoshop \u4e2d\u4fdd\u7559\u900f\u660e\u80cc\u666f\u540e\u5bfc\u51fa PNG\u3002');
    }
    const maxRow = rows.reduce((max, row) => Math.max(max, row.count), 0);
    const threshold = maxRow * 0.92;
    let bestStart = -1;
    let bestEnd = -1;
    let start = -1;
    for (let y = 0; y <= height; y += 1) {
      const active = y < height && rows[y].count >= threshold;
      if (active && start < 0) start = y;
      if (!active && start >= 0) {
        if (bestStart < 0 || y - start > bestEnd - bestStart) {
          bestStart = start;
          bestEnd = y;
        }
        start = -1;
      }
    }
    if (bestStart < 0 || bestEnd - bestStart < 20) throw new Error('\u65e0\u6cd5\u5b9a\u4f4d\u56db\u9762\u8fde\u7eed\u7684\u7eb8\u76d2\u4e3b\u4f53\u3002');
    const sampleRows = rows.slice(bestStart, bestEnd).filter((row) => row.count >= threshold);
    const bodyLeft = Math.min(...sampleRows.map((row) => row.left));
    const bodyRight = Math.max(...sampleRows.map((row) => row.right + 1));
    const bodyWidth = bodyRight - bodyLeft;
    const bodyHeight = bestEnd - bestStart;
    const physicalBodyWidth = 2 * (spec.length + spec.width);
    const scaleX = bodyWidth / physicalBodyWidth;
    const scaleY = bodyHeight / spec.height;
    const scaleDelta = Math.abs(scaleX - scaleY) / Math.max(scaleX, scaleY);
    if (scaleDelta > 0.045) throw new Error('\u7eb8\u76d2\u4e3b\u4f53\u6bd4\u4f8b\u4e0e PLM \u5c3a\u5bf8\u4e0d\u4e00\u81f4\uff0c\u8bf7\u786e\u8ba4 SKU \u548c\u5bfc\u51fa\u56fe\u662f\u5426\u5339\u914d\u3002');
    const topRect = {
      x: bodyLeft + spec.width * scaleX,
      y: bestStart - spec.width * scaleY,
      width: spec.length * scaleX,
      height: spec.width * scaleY,
    };
    const bottomRect = {
      x: bodyLeft + (2 * spec.width + spec.length) * scaleX,
      y: bestEnd,
      width: spec.length * scaleX,
      height: spec.width * scaleY,
    };
    if (topRect.y < -2 || bottomRect.y + bottomRect.height > height + 2) throw new Error('\u9876\u76d6\u6216\u5e95\u76d6\u4e0d\u5b8c\u6574\uff0c\u8bf7\u5bfc\u51fa\u5305\u542b\u5b8c\u6574\u7eb8\u76d2\u8f6e\u5ed3\u7684 PNG\u3002');
    const coverage = (rect) => {
      const x0 = Math.max(0, Math.round(rect.x));
      const y0 = Math.max(0, Math.round(rect.y));
      const x1 = Math.min(width, Math.round(rect.x + rect.width));
      const y1 = Math.min(height, Math.round(rect.y + rect.height));
      let hits = 0;
      let samples = 0;
      const step = Math.max(1, Math.floor(Math.min(rect.width, rect.height) / 90));
      for (let y = y0; y < y1; y += step) {
        for (let x = x0; x < x1; x += step) {
          samples += 1;
          if (pixels[(y * width + x) * 4 + 3] > 12) hits += 1;
        }
      }
      return samples ? hits / samples : 0;
    };
    const bodyCoverage = coverage({ x: bodyLeft, y: bestStart, width: bodyWidth, height: bodyHeight });
    if (bodyCoverage < 0.94 || coverage(topRect) < 0.82 || coverage(bottomRect) < 0.82) {
      throw new Error('\u900f\u660e\u8f6e\u5ed3\u4e0d\u7b26\u5408\u201c\u56db\u9762\u4e3b\u4f53 + \u7b2c\u4e8c\u9762\u9876\u76d6 + \u7b2c\u56db\u9762\u5e95\u76d6\u201d\u7ed3\u6784\u3002');
    }
    return {
      bodyLeft: bodyLeft * image.naturalWidth / width,
      bodyTop: bestStart * image.naturalHeight / height,
      pixelsPerCmX: scaleX * image.naturalWidth / width,
      pixelsPerCmY: scaleY * image.naturalHeight / height,
    };
  }

  function analyzeLabelSizeImageGeometry(image, spec) {
    const maxSide = 1600;
    const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    let left = width;
    let top = height;
    let right = -1;
    let bottom = -1;
    let transparent = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = pixels[(y * width + x) * 4 + 3];
        if (alpha <= 12) transparent += 1;
        if (alpha > 12) {
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
    }
    const useAlphaBounds = transparent > width * height * 0.02 && right >= left && bottom >= top;
    if (!useAlphaBounds) {
      left = 0;
      top = 0;
      right = width - 1;
      bottom = height - 1;
    }
    const cropWidth = right - left + 1;
    const cropHeight = bottom - top + 1;
    const sourceRatio = cropWidth / cropHeight;
    const expectedRatio = spec.width / spec.height;
    const directDelta = Math.abs(sourceRatio - expectedRatio) / expectedRatio;
    const rotatedDelta = Math.abs((1 / sourceRatio) - expectedRatio) / expectedRatio;
    const rotated = rotatedDelta < directDelta;
    if (Math.min(directDelta, rotatedDelta) > 0.065) {
      throw new Error('\u56fe\u7247\u6bd4\u4f8b\u4e0e PLM \u6807\u7b7e\u5c3a\u5bf8 ' + formatSizeImageNumber(spec.width) + ' \u00d7 ' + formatSizeImageNumber(spec.height) + ' cm \u4e0d\u5339\u914d\u3002');
    }
    return {
      cropX: left * image.naturalWidth / width,
      cropY: top * image.naturalHeight / height,
      cropWidth: cropWidth * image.naturalWidth / width,
      cropHeight: cropHeight * image.naturalHeight / height,
      rotated,
    };
  }

  function generateSizeImageJpeg(image, geometry, spec, data, includeRemark, includeRoundArc, customRemark) {
    const canvas = document.createElement('canvas');
    canvas.width = 3000;
    canvas.height = 3000;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.textBaseline = 'top';
    context.fillStyle = '#000000';
    context.font = '700 88px "Microsoft YaHei", "PingFang SC", sans-serif';
    context.fillText(getSizeImageTitle('carton', data, includeRemark, includeRoundArc, customRemark), 505, 140);
    context.font = '78px "Microsoft YaHei", "PingFang SC", sans-serif';
    context.fillText('\u89c4\u683c\u5c3a\u5bf8\uff1a\u957f' + formatSizeImageNumber(spec.length) + 'X\u5bbd' + formatSizeImageNumber(spec.width) + 'X\u9ad8' + formatSizeImageNumber(spec.height) + 'CM', 505, 260);
    context.fillStyle = '#ee1410';
    context.font = '76px "Microsoft YaHei", "PingFang SC", sans-serif';
    context.fillText('(\u751f\u4ea7\u65e5\u671f+\u622a\u6b62\u65e5\u671f+\u6279\u6b21\u53f7)', 505, 370);

    const physicalWidth = 2 * (spec.length + spec.width);
    const physicalHeight = spec.height + 2 * spec.width;
    const drawScale = Math.min(1600 / physicalWidth, 2020 / physicalHeight);
    const artWidth = physicalWidth * drawScale;
    const artX = Math.round((3000 - artWidth) / 2);
    const artY = 650;
    const bodyTop = artY + spec.width * drawScale;
    const bodyBottom = bodyTop + spec.height * drawScale;
    context.save();
    context.beginPath();
    context.rect(artX + spec.width * drawScale, artY, spec.length * drawScale, spec.width * drawScale);
    context.rect(artX, bodyTop, physicalWidth * drawScale, spec.height * drawScale);
    context.rect(artX + (2 * spec.width + spec.length) * drawScale, bodyBottom, spec.length * drawScale, spec.width * drawScale);
    context.clip();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    const imageX = artX - geometry.bodyLeft / geometry.pixelsPerCmX * drawScale;
    const imageY = bodyTop - geometry.bodyTop / geometry.pixelsPerCmY * drawScale;
    context.drawImage(image, imageX, imageY, image.naturalWidth / geometry.pixelsPerCmX * drawScale, image.naturalHeight / geometry.pixelsPerCmY * drawScale);
    context.restore();
    traceCartonSizeImageOutline(context, artX, artY, drawScale, spec);
    context.strokeStyle = '#000000';
    context.lineWidth = 1;
    context.stroke();

    context.strokeStyle = '#ee1410';
    context.fillStyle = '#ee1410';
    context.lineWidth = 4;
    const tick = 28;
    const heightX = artX - 48;
    drawSizeImageLine(context, heightX, bodyTop, heightX, bodyBottom);
    drawSizeImageLine(context, heightX - tick, bodyTop, heightX + tick, bodyTop);
    drawSizeImageLine(context, heightX - tick, bodyBottom, heightX + tick, bodyBottom);
    context.save();
    context.translate(heightX - 112, (bodyTop + bodyBottom) / 2);
    context.rotate(-Math.PI / 2);
    context.font = '66px "Microsoft YaHei", "PingFang SC", sans-serif';
    context.textAlign = 'center';
    context.fillText(formatSizeImageNumber(spec.height) + 'cm', 0, 0);
    context.restore();

    const bottomY = bodyBottom + 48;
    const firstEnd = artX + spec.width * drawScale;
    const secondEnd = firstEnd + spec.length * drawScale;
    drawSizeImageLine(context, artX, bottomY, secondEnd, bottomY);
    [artX, firstEnd, secondEnd].forEach((x) => drawSizeImageLine(context, x, bottomY - tick, x, bottomY + tick));
    context.font = '66px "Microsoft YaHei", "PingFang SC", sans-serif';
    context.textAlign = 'center';
    context.fillText(formatSizeImageNumber(spec.width) + 'cm', (artX + firstEnd) / 2, bottomY + 34);
    context.fillText(formatSizeImageNumber(spec.length) + 'cm', (firstEnd + secondEnd) / 2, bottomY + 34);
    return canvas.toDataURL('image/jpeg', 0.96);
  }

  function traceCartonSizeImageOutline(context, artX, artY, scale, spec) {
    const width = spec.width;
    const length = spec.length;
    const bodyTop = artY + width * scale;
    const bodyBottom = bodyTop + spec.height * scale;
    const flapBottom = bodyBottom + width * scale;
    context.beginPath();
    context.moveTo(artX, bodyTop);
    context.lineTo(artX + width * scale, bodyTop);
    context.lineTo(artX + width * scale, artY);
    context.lineTo(artX + (width + length) * scale, artY);
    context.lineTo(artX + (width + length) * scale, bodyTop);
    context.lineTo(artX + 2 * (width + length) * scale, bodyTop);
    context.lineTo(artX + 2 * (width + length) * scale, flapBottom);
    context.lineTo(artX + (2 * width + length) * scale, flapBottom);
    context.lineTo(artX + (2 * width + length) * scale, bodyBottom);
    context.lineTo(artX, bodyBottom);
    context.closePath();
  }

  function generateLabelSizeImageJpeg(image, geometry, spec, data, includeRemark, includeRoundArc, includeBatchNumber, customRemark) {
    const canvas = document.createElement('canvas');
    canvas.width = 3000;
    canvas.height = 3000;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.textBaseline = 'top';
    context.fillStyle = '#000000';
    context.font = '700 88px "Microsoft YaHei", "PingFang SC", sans-serif';
    context.fillText(getSizeImageTitle('label', data, includeRemark, includeRoundArc, customRemark), 505, 140);
    context.font = '78px "Microsoft YaHei", "PingFang SC", sans-serif';
    context.fillText('\u89c4\u683c\u5c3a\u5bf8\uff1a\u5bbd' + formatSizeImageNumber(spec.width) + 'X\u9ad8' + formatSizeImageNumber(spec.height) + 'CM', 505, 260);
    if (includeBatchNumber) {
      context.fillStyle = '#ee1410';
      context.font = '76px "Microsoft YaHei", "PingFang SC", sans-serif';
      context.fillText('\uff08\u6279\u6b21\u53f7\uff09', 469, 370);
    }

    const drawScale = Math.min(1600 / spec.width, 1320 / spec.height);
    const artWidth = spec.width * drawScale;
    const artHeight = spec.height * drawScale;
    const artX = Math.round((3000 - artWidth) / 2);
    const artY = clamp(Math.round((3000 - artHeight) / 2), 860, 1040);
    const cornerRadius = includeRoundArc ? Math.min(18, Math.max(6, drawScale * 0.08)) : 0;
    context.save();
    context.beginPath();
    if (cornerRadius) traceSizeImageRoundedRect(context, artX, artY, artWidth, artHeight, cornerRadius);
    else context.rect(artX, artY, artWidth, artHeight);
    context.clip();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    if (geometry.rotated) {
      context.translate(artX + artWidth / 2, artY + artHeight / 2);
      context.rotate(-Math.PI / 2);
      context.drawImage(image, geometry.cropX, geometry.cropY, geometry.cropWidth, geometry.cropHeight, -artHeight / 2, -artWidth / 2, artHeight, artWidth);
    } else {
      context.drawImage(image, geometry.cropX, geometry.cropY, geometry.cropWidth, geometry.cropHeight, artX, artY, artWidth, artHeight);
    }
    context.restore();
    context.strokeStyle = '#000000';
    context.lineWidth = 1;
    if (cornerRadius) {
      context.beginPath();
      traceSizeImageRoundedRect(context, artX + 0.5, artY + 0.5, artWidth - 1, artHeight - 1, Math.max(0, cornerRadius - 0.5));
      context.stroke();
    } else {
      context.strokeRect(artX + 0.5, artY + 0.5, artWidth - 1, artHeight - 1);
    }

    context.strokeStyle = '#ee1410';
    context.fillStyle = '#ee1410';
    context.lineWidth = 4;
    const tick = 28;
    const heightX = artX - 48;
    drawSizeImageLine(context, heightX, artY, heightX, artY + artHeight);
    drawSizeImageLine(context, heightX - tick, artY, heightX + tick, artY);
    drawSizeImageLine(context, heightX - tick, artY + artHeight, heightX + tick, artY + artHeight);
    context.save();
    context.translate(heightX - 112, artY + artHeight / 2);
    context.rotate(-Math.PI / 2);
    context.font = '66px "Microsoft YaHei", "PingFang SC", sans-serif';
    context.textAlign = 'center';
    context.fillText(formatSizeImageNumber(spec.height) + 'cm', 0, 0);
    context.restore();
    const bottomY = artY + artHeight + 48;
    drawSizeImageLine(context, artX, bottomY, artX + artWidth, bottomY);
    drawSizeImageLine(context, artX, bottomY - tick, artX, bottomY + tick);
    drawSizeImageLine(context, artX + artWidth, bottomY - tick, artX + artWidth, bottomY + tick);
    context.font = '66px "Microsoft YaHei", "PingFang SC", sans-serif';
    context.textAlign = 'center';
    context.fillText(formatSizeImageNumber(spec.width) + 'cm', artX + artWidth / 2, bottomY + 34);
    return canvas.toDataURL('image/jpeg', 0.96);
  }

  function getSizeImageTitle(type, data, includeRemark, includeRoundArc, customRemark) {
    const base = type === 'label' ? '\u6807\u7b7e' : '\u7eb8\u76d2';
    if (!includeRemark && typeof customRemark !== 'string') return base;
    const remarks = getSizeImageRemarks(data);
    const sourceRemark = typeof customRemark === 'string' ? customRemark.trim() : (type === 'label' ? remarks.label : remarks.carton);
    const roundArcRemark = type === 'label' && includeRoundArc && !String(sourceRemark || '').includes('\u5706\u5f27') ? '\u5706\u5f27' : '';
    const remark = [sourceRemark, roundArcRemark].filter(Boolean).join(' ');
    return remark ? base + '\uff08' + remark + '\uff09' : base;
  }

  function traceSizeImageRoundedRect(context, x, y, width, height, radius) {
    const r = Math.max(0, Math.min(Number(radius) || 0, width / 2, height / 2));
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  function drawSizeImageLine(context, x1, y1, x2, y2) {
    context.beginPath();
    context.moveTo(Math.round(x1), Math.round(y1));
    context.lineTo(Math.round(x2), Math.round(y2));
    context.stroke();
  }

  function formatSizeImageError(error) {
    const message = String(error && error.message || error || '').trim();
    return message || '\u65e0\u6cd5\u8bc6\u522b\u7eb8\u76d2\u6216\u6807\u7b7e\uff0c\u8bf7\u68c0\u67e5\u56fe\u7247\u4e0e PLM \u5c3a\u5bf8\u662f\u5426\u5339\u914d\u3002';
  }

  async function saveCurrentSizeImagesToFolder() {
    const sku = state.selectedSku || (state.data && state.data.sku) || '';
    const session = sku && state.sizeImageSessions[sku];
    const files = session ? [
      session.cartonResultDataUrl ? { name: sku + '-\u7eb8\u76d2\u5c3a\u5bf8\u56fe.jpg', dataUrl: session.cartonResultDataUrl } : null,
      session.labelResultDataUrl ? { name: sku + '-\u6807\u7b7e\u5c3a\u5bf8\u56fe.jpg', dataUrl: session.labelResultDataUrl } : null,
    ].filter(Boolean) : [];
    if (!files.length) {
      showToast('\u8bf7\u5148\u751f\u6210\u7eb8\u76d2\u6216\u6807\u7b7e\u5c3a\u5bf8\u56fe');
      return;
    }
    const picker = getSaveFilePicker();
    if (!picker) {
      showToast('\u5f53\u524d\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u53e6\u5b58\u4e3a\uff0c\u8bf7\u4f7f\u7528\u6700\u65b0\u7248 Chrome');
      return;
    }
    try {
      for (const file of files) {
        const handle = await picker({
          suggestedName: file.name,
          types: [{ description: 'JPEG Image', accept: { 'image/jpeg': ['.jpg', '.jpeg'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(await (await fetch(file.dataUrl)).blob());
        await writable.close();
      }
      showToast('\u5df2\u4fdd\u5b58 ' + files.length + ' \u4e2a\u5c3a\u5bf8\u56fe JPG');
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      console.warn('PLM floating helper size image folder save failed:', error);
      showToast('\u4fdd\u5b58\u5931\u8d25\uff1a' + formatErrorMessage(error));
    }
  }

  async function regenerateCurrentSizeImages() {
    const sku = state.selectedSku || (state.data && state.data.sku) || '';
    const session = sku && ensureSizeImageSession(sku);
    if (!session) return;
    if (session.cartonFile) await processSizeImageFile(session.cartonFile, 'carton', true);
    if (session.labelFile) await processSizeImageFile(session.labelFile, 'label', true);
  }

  function ledgerViewHtml(records) {
    const mode = state.ledgerView === 'finalized' ? 'finalized' : 'design';
    const groups = groupLedgerRecordsByDate(records, mode);
    const rows = groups.length ? groups.map((group) => '<section class="pfh-ledger-day"><h4>' + escapeHtml(formatLedgerDateLabel(group.date)) + '<span>' + escapeHtml(String(group.items.length)) + ' 条</span></h4>' + group.items.map((record) => ledgerRowHtml(record, mode)).join('') + '</section>').join('') : '<div class="pfh-ledger-empty">' + escapeHtml(mode === 'finalized' ? '本月还没有已定稿记录。' : '本月还没有出图记录。打开设计分配在本月的 PLM 详情后会自动加入。') + '</div>';
    const month = getCurrentLedgerMonth();
    return '<div class="pfh-detail-scroll"><section class="pfh-ledger-page">' +
      '<div class="pfh-ledger-hero"><div><h3>今日工作台</h3><p>按设计分配日期整理出图，定稿后继续跟纸盒、标签和图包。</p></div><span>' + escapeHtml(records.length + ' 条 / ' + month) + '</span></div>' +
      '<div class="pfh-ledger-tabs">' +
        '<button type="button" class="' + (mode === 'design' ? 'is-active' : '') + (state.ledgerTabTransition === 'design' ? ' is-tab-transition' : '') + '" data-action="ledger-view-design">待定稿</button>' +
        '<button type="button" class="' + (mode === 'finalized' ? 'is-active' : '') + (state.ledgerTabTransition === 'finalized' ? ' is-tab-transition' : '') + '" data-action="ledger-view-finalized">已定稿</button>' +
      '</div>' +
      '<div class="pfh-ledger-toolbar">' +
        '<button type="button" class="pfh-ledger-month" data-action="ledger-prev-month" title="上个月">‹</button>' +
        '<button type="button" class="pfh-ledger-month-label" data-action="ledger-today">' + escapeHtml(formatLedgerMonthLabel(month)) + '</button>' +
        '<button type="button" class="pfh-ledger-month" data-action="ledger-next-month" title="下个月">›</button>' +
        '<button type="button" data-action="ledger-today">本月</button>' +
        '<button type="button" data-action="ledger-copy" title="导出已定稿内容到登记表">导出到登记</button>' +
        '<button type="button" data-action="ledger-copy-finalized" title="复制今日定稿编码">复制编码</button>' +
      '</div>' +
      '<div class="pfh-ledger-list">' + rows + '</div>' +
      ledgerTimeEditorHtml() +
      '</section></div>';
  }

  function ledgerRowHtml(record, mode) {
    const sku = record.sku || '';
    const title = [record.brand, record.name].filter(Boolean).join(' ') || sku;
    const thumbUrl = mode === 'design' ? record.benchmarkImageUrl : (record.skuImageUrl || record.benchmarkImageUrl);
    const thumb = thumbUrl ? '<img src="' + escapeHtml(thumbUrl) + '" alt="">' : '<span class="pfh-ledger-thumb-empty">' + iconHtml('image') + '</span>';
    const status = record.status || '待定稿';
    const imageGenerated = Boolean(record.imageGeneratedAt);
    const workflowStatus = /^(?:作废|已完成|异常)$/.test(status) ? status : (record.finalizedAt ? '已定稿' : (imageGenerated ? '待定稿' : '待出图'));
    const workDate = mode === 'finalized' ? getLedgerFinalizedDate(record) : getLedgerDesignDate(record);
    const designType = record.designType || '未分类';
    const artPriority = record.artPriority || '';
    const priorityClass = /^P0.*(?:紧急|urgent)/i.test(artPriority) ? ' is-p0-urgent' : (/^P0.*(?:当日|当天|today)/i.test(artPriority) ? ' is-p0-today' : (/^P0/i.test(artPriority) ? ' is-p0-urgent' : (/^P1/i.test(artPriority) ? ' is-p1' : '')));
    const packageCode = record.packageCode || '';
    const printCode = record.printCode || '';
    const purchasePrice = String(record.purchasePrice || '').trim();
    const dateAttr = escapeHtml(record.date || workDate);
    const referenceButton = record.referenceUrl
      ? '<button type="button" class="pfh-ledger-link" data-action="ledger-open-reference" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '" title="打开参考链接">' + iconHtml('link') + '</button>'
      : '<button type="button" class="pfh-ledger-link is-disabled" disabled title="没有参考链接">' + iconHtml('link') + '</button>';
    const statusPill = '<span class="pfh-ledger-status is-' + escapeHtml(getLedgerStatusClass(workflowStatus)) + '">' + escapeHtml(workflowStatus) + '</span>';
    const dateText = mode === 'finalized'
      ? ('定稿 ' + (record.finalizedAt ? formatLedgerMinuteLabel(record.finalizedAt, workDate) : formatLedgerDateLabel(workDate)))
      : ('分配 ' + formatLedgerMinuteLabel(record.designAssignedAt || workDate, workDate));
    const tagHtml = '<div class="pfh-ledger-tags">' +
      '<span class="is-sku" title="产品编码">' + escapeHtml(sku) + '</span>' +
      '<span class="is-design-type" title="设计类型">' + escapeHtml(designType) + '</span>' +
      (artPriority ? '<span class="is-priority' + priorityClass + '" title="美工处理优先级">' + escapeHtml(artPriority) + '</span>' : '') +
      '</div>';
    const assignmentHtml = '<div class="pfh-ledger-assignment">' + escapeHtml(dateText) +
      (mode === 'finalized' ? '<button type="button" class="pfh-ledger-edit-time" data-action="ledger-edit-finalized-time" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">改时间</button>' : '') +
      '</div>';
    const workflowHtml = '<div class="pfh-ledger-flow is-step-' + (record.finalizedAt ? '3' : (imageGenerated ? '2' : '1')) + '">' +
      '<span><i></i>出图</span><em></em><span><i></i>定稿</span><em></em><span><i></i>文件</span></div>';
    const menuHtml = ledgerOverflowMenuHtml(record, sku, dateAttr, imageGenerated);
    const moreButton = '<div class="pfh-ledger-more"><button type="button" data-action="ledger-more" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '" aria-label="更多操作"><span class="pfh-more-dots"><i></i><i></i><i></i></span></button>' + menuHtml + '</div>';
    const actions = mode === 'finalized'
      ? '<div class="pfh-ledger-file-actions">' +
        ledgerFileButtonHtml('ledger-toggle-box-file', sku, dateAttr, '纸盒', packageCode, record.boxFileState, record.boxFileDone) +
        ledgerFileButtonHtml('ledger-toggle-label-file', sku, dateAttr, '标签', printCode, record.labelFileState, record.labelFileDone) +
        ledgerFileButtonHtml('ledger-toggle-image-pack', sku, dateAttr, '图包', '', record.imagePackState, record.imagePackDone) +
        moreButton +
      '</div>'
      : '<div class="pfh-ledger-actions">' +
        (!imageGenerated ? '<button type="button" class="is-primary is-generate" data-action="ledger-image-generated" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '"><span>出图</span></button>' : (record.finalizedAt ? '<span class="pfh-ledger-complete">已定稿</span>' : '<label class="pfh-ledger-price' + (state.ledgerFlowTransitionSku === sku ? ' is-flow-transition' : '') + '"><span>¥</span><input type="text" inputmode="decimal" value="' + escapeHtml(purchasePrice) + '" placeholder="价格" aria-label="产品价格"></label><button type="button" class="is-primary is-finalize' + (state.ledgerFlowTransitionSku === sku ? ' is-flow-transition' : '') + '" data-action="ledger-finalize" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">' + ledgerFinalizeCheckIconHtml() + '<span>定稿</span><em>已出图</em></button>')) +
        moreButton +
      '</div>';
    return '<article class="pfh-ledger-item is-' + escapeHtml(mode) + '" data-ledger-sku="' + escapeHtml(sku) + '" data-ledger-date="' + dateAttr + '">' +
      '<button type="button" class="pfh-ledger-thumb" data-action="ledger-open-sku" data-sku="' + escapeHtml(sku) + '">' + thumb + '</button>' +
      '<div class="pfh-ledger-main">' +
        '<div class="pfh-ledger-title-row"><button type="button" class="pfh-ledger-title" data-action="ledger-open-sku" data-sku="' + escapeHtml(sku) + '"><b>' + escapeHtml(title) + '</b></button>' + referenceButton + statusPill + '</div>' +
        tagHtml +
        assignmentHtml +
        '<div class="pfh-ledger-bottom">' + workflowHtml + actions + '</div>' +
      '</div>' +
    '</article>';
  }

  function refreshLedgerCard(record) {
    if (!record || state.view !== 'ledger') {
      renderShell();
      return;
    }
    const mode = state.ledgerView === 'finalized' ? 'finalized' : 'design';
    const panel = ensurePanel();
    const card = Array.from(panel.querySelectorAll('.pfh-ledger-item')).find((item) => item.getAttribute('data-ledger-sku') === record.sku && item.getAttribute('data-ledger-date') === record.date);
    if ((mode === 'finalized' && (!record.finalizedAt || record.status === '作废')) || (mode === 'design' && record.finalizedAt)) {
      if (card) card.remove();
      else renderShell();
      return;
    }
    if (!card) {
      renderShell();
      return;
    }
    card.outerHTML = ledgerRowHtml(record, mode);
  }

  function ledgerOverflowMenuHtml(record, sku, dateAttr, imageGenerated) {
    if (state.ledgerMenuSku !== sku) return '';
    const rollback = record.finalizedAt
      ? '<button type="button" data-action="ledger-unfinalize" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">撤回定稿</button>'
      : (imageGenerated ? '<button type="button" data-action="ledger-unmark-image-generated" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">撤回出图</button>' : '');
    return '<div class="pfh-ledger-overflow-menu">' + rollback +
      '<button type="button" data-action="ledger-void" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">作废</button>' +
      '<button type="button" data-action="ledger-done" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">完成</button>' +
      '<button type="button" data-action="ledger-remove" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">移除</button>' +
      '</div>';
  }

  function ledgerFileButtonHtml(action, sku, dateAttr, label, code, stateValue, doneFallback) {
    const value = normalizeLedgerFileState(stateValue, doneFallback);
    const title = label + '\uff1a' + ledgerFileStateLabel(value) + (code ? ' \u00b7 ' + code : '');
    return '<button type="button" class="is-' + escapeHtml(value) + '" data-action="' + action + '" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '" title="' + escapeHtml(title) + '"><span>' + escapeHtml(label) + '</span>' + (value !== 'skip' && code ? '<small>' + escapeHtml(code) + '</small>' : '') + '</button>';
  }

  function ledgerFinalizeCheckIconHtml() {
    return '<svg class="pfh-ledger-finalize-check" viewBox="0 0 1024 1024" aria-hidden="true"><path d="M511.93 64.07C264.54 64.07 64 264.62 64 512s200.54 447.93 447.93 447.93c58.83 0.07 117.09-11.5 171.43-34.04 167.5-69.32 276.7-232.76 276.64-414.03-0.08-247.39-200.69-447.87-448.07-447.79z m0.41 831.87c-212.04 0.11-384.03-171.69-384.14-383.73-0.11-212.04 171.69-384.03 383.73-384.14 50.5 0 100.51 9.93 147.18 29.24C802.49 216.72 895.99 356.6 896.08 511.8c0.11 212.04-171.7 384.02-383.74 384.14z"></path><path d="M431.85 660.55l-121.19-121.2c-12.49-12.49-12.49-32.75 0-45.24 12.49-12.49 32.75-12.49 45.24 0l92.11 92.11L668.1 366.13c12.49-12.49 32.75-12.49 45.24 0 12.49 12.49 12.49 32.75 0 45.24L464.17 660.55c-8.92 8.92-23.39 8.92-32.32 0z"></path></svg>';
  }

  function ledgerTimeEditorHtml() {
    const editor = state.ledgerTimeEditor;
    if (!editor) return '';
    const date = new Date(editor.timeMs || Date.now());
    const dateValue = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return '<div class="pfh-ledger-time-modal" role="dialog" aria-modal="true" aria-label="修改定稿时间">' +
      '<div class="pfh-ledger-time-card">' +
        '<div class="pfh-ledger-time-head"><div><b>修改定稿时间</b><span>' + escapeHtml(editor.sku) + '</span></div><button type="button" data-action="ledger-time-close" aria-label="关闭">×</button></div>' +
        '<div class="pfh-ledger-time-fields"><label>日期<input class="pfh-ledger-time-date" type="text" inputmode="numeric" value="' + escapeHtml(dateValue) + '" placeholder="2026-07-10"></label><label>时间<span class="pfh-ledger-time-clock"><input class="pfh-ledger-time-hour" type="text" inputmode="numeric" maxlength="2" value="' + hour + '"><i>:</i><input class="pfh-ledger-time-minute" type="text" inputmode="numeric" maxlength="2" value="' + minute + '"></span></label></div>' +
        '<div class="pfh-ledger-time-presets"><button type="button" data-action="ledger-time-today">今天</button><button type="button" data-action="ledger-time-yesterday">昨天</button><button type="button" data-action="ledger-time-day-before">前天</button></div>' +
        '<div class="pfh-ledger-time-actions"><button type="button" data-action="ledger-time-close">取消</button><button type="button" class="is-primary" data-action="ledger-time-save">保存时间</button></div>' +
      '</div></div>';
  }

  function formatLedgerMonthLabel(month) {
    const match = String(month || '').match(/^(\d{4})-(\d{2})$/);
    return match ? (match[1] + ' 年 ' + Number(match[2]) + ' 月') : String(month || '本月');
  }

  function productThumbHtml(data) {
    const src = getProductThumbUrl(data) || (data && (data.benchmarkImageUrl || data.benchmarkImageFallbackUrl)) || '';
    if (!src) return '<span class="pfh-product-thumb is-empty">' + iconHtml('image') + '</span>';
    return '<button type="button" class="pfh-product-thumb" title="悬浮放大预览">' +
      '<span class="pfh-thumb-frame"><img src="' + escapeHtml(src) + '" alt=""></span>' +
      '<span class="pfh-thumb-preview"><img src="' + escapeHtml(src) + '" alt=""></span>' +
      '</button>';
  }

  function updateProductThumbInPlace(data) {
    if (!data || !data.sku || state.view !== 'detail' || !state.data || state.data.sku !== data.sku) return false;
    const panel = ensurePanel();
    const current = panel.querySelector('.pfh-product-hero .pfh-product-thumb');
    if (!current) return false;
    const src = getProductThumbUrl(data) || data.benchmarkImageUrl || data.benchmarkImageFallbackUrl || '';
    if (!src) return false;
    if (current.matches('button')) {
      current.querySelectorAll('img').forEach((image) => {
        if (image.getAttribute('src') !== src) image.setAttribute('src', src);
      });
    } else {
      current.outerHTML = productThumbHtml(data);
    }
    return true;
  }

  function updateInsightRecommendationInPlace(sku) {
    if (!sku || state.view !== 'detail' || !state.data || state.data.sku !== sku) return false;
    const panel = ensurePanel();
    const section = panel.querySelector('.pfh-graphic-section');
    if (!section) return false;
    const current = section.querySelector('.pfh-smart-recommend');
    const html = insightRecommendationHtml(state.data);
    if (current && html) current.outerHTML = html;
    else if (current) current.remove();
    else if (html) section.insertAdjacentHTML('beforeend', html);
    return true;
  }

  function formatPrintSizeDisplay(data) {
    if (!data) return '';
    return [data.printSizeText || '', data.tubeSegmentText || ''].filter(Boolean).join('\n');
  }

  function renderStatusHtml(statusText) {
    if (state.scanRunning || statusText === L.scanning || statusText === L.checkingMaterial) {
      const tip = getCurrentLoadingTip();
      return '<div class="pfh-status pfh-loading-tip"><span>\u8bc6\u522b\u4e2d</span><strong>' + escapeHtml(tip) + '</strong></div>';
    }
    return '';
  }

  function isLoadingTipVisible() {
    const panel = document.getElementById(PANEL_ID);
    return Boolean(panel && panel.querySelector('.pfh-detail.is-loading .pfh-loading-tip'));
  }

  function getCurrentLoadingTip() {
    const tips = normalizeLoadingTips(state.loadingTips);
    const seed = state.scanTargetSku || state.selectedSku || state.sku || String(Date.now());
    if (!state.loadingTipText || !tips.includes(state.loadingTipText)) lockLoadingTip(seed);
    return state.loadingTipText || DEFAULT_LOADING_TIPS[0];
  }

  function lockLoadingTip(seed) {
    const stableSeed = String(seed || state.scanTargetSku || state.selectedSku || state.sku || Date.now());
    if (state.loadingTipSeed === stableSeed && state.loadingTipText) return;
    state.loadingTipText = pickLoadingTip(state.loadingTips, stableSeed);
    state.loadingTipSeed = stableSeed;
  }

  function pickLoadingTip(tips, seed) {
    const list = normalizeLoadingTips(tips);
    let hash = 0;
    String(seed || '').split('').forEach((char) => {
      hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    });
    return list[Math.abs(hash) % list.length] || DEFAULT_LOADING_TIPS[0];
  }

  function normalizeLoadingTips(tips) {
    const list = (Array.isArray(tips) ? tips : [])
      .map((item) => typeof item === 'string' ? item : (item && item.text))
      .map((text) => String(text || '').trim())
      .filter(Boolean);
    return list.length ? Array.from(new Set(list)).slice(0, 80) : DEFAULT_LOADING_TIPS.slice();
  }

  function insightRecommendationHtml(data) {
    if (!data || !data.sku) return '';
    const recommendation = state.insightRecommendationSku === data.sku ? state.insightRecommendation : null;
    if (state.insightRecommendationLoading && state.insightRecommendationSku === data.sku) {
      return '<div class="pfh-smart-recommend is-loading"><strong>\u667a\u80fd\u8865\u5168</strong><span>\u6b63\u5728\u5339\u914d\u5386\u53f2\u4ef7\u683c\u548c\u5546\u54c1\u7c7b\u578b...</span></div>';
    }
    if (!recommendation || !recommendation.recommendedPrice) return '';
    const type = recommendation.effectiveProductType || recommendation.recommendedProductType || recommendation.productType || '';
    const confidence = recommendation.priceConfidence || recommendation.recommendationConfidence || '';
    const stats = formatRecommendationPriceStats(recommendation.priceStats);
    const reason = recommendation.recommendationReason || buildLocalRecommendationReason(recommendation, type);
    const samples = formatRecommendationSamples(recommendation.priceSamples);
    return '<div class="pfh-smart-recommend"><strong>\u667a\u80fd\u8865\u5168</strong>' +
      '<span>\u63a8\u8350\u4ef7\u683c <b>' + escapeHtml(String(recommendation.recommendedPrice)) + '</b>' + (type ? ' / ' + escapeHtml(type) : '') + (confidence ? ' / \u7f6e\u4fe1\u5ea6' + escapeHtml(confidence) : '') + '</span>' +
      (stats || reason ? '<small>' + escapeHtml([stats, reason].filter(Boolean).join(' / ')) + '</small>' : '') +
      (samples ? '<em>\u6837\u672c\u4f9d\u636e\uff1a' + escapeHtml(samples) + '</em>' : '') +
      '</div>';
  }

  function formatRecommendationSamples(samples) {
    if (!Array.isArray(samples) || !samples.length) return '';
    return samples.slice(0, 3).map((item) => {
      const sku = item && item.sku ? String(item.sku) : '';
      const price = item && item.price ? String(item.price) : '';
      const type = item && item.productType ? String(item.productType) : '';
      const packQty = item && item.packQty ? '\u88c5' + String(item.packQty) : '';
      return [sku, price ? '\uffe5' + price : '', type, packQty].filter(Boolean).join(' ');
    }).filter(Boolean).join('；');
  }

  function scheduleInsightRecommendation(data) {
    const sku = data && data.sku;
    if (!sku || state.insightRecommendationLoading || state.insightRecommendationSku === sku) return;
    state.insightRecommendationSku = sku;
    state.insightRecommendation = null;
    state.insightRecommendationLoading = true;
    window.setTimeout(() => loadInsightRecommendationForDetail(sku).catch((error) => {
      addLog('warn', '\u667a\u80fd\u8865\u5168\u5efa\u8bae\u83b7\u53d6\u5931\u8d25', sku + ' ' + formatErrorMessage(error));
    }).finally(() => {
      if (state.insightRecommendationSku === sku) {
        state.insightRecommendationLoading = false;
        if (!updateInsightRecommendationInPlace(sku)) renderShell();
      }
    }), 120);
  }

  async function loadInsightRecommendationForDetail(sku) {
    const data = normalizeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : null));
    if (!data || !data.sku) return;
    const productType = getProductTypeForInsight(data, null);
    const cloudRecommendation = await fetchInsightRecommendation(data, productType).catch(() => null);
    const recommendedType = cloudRecommendation && cloudRecommendation.recommendedProductType && cloudRecommendation.recommendedProductType !== productType ? cloudRecommendation.recommendedProductType : '';
    const effectiveProductType = recommendedType || (cloudRecommendation && cloudRecommendation.effectiveProductType) || productType;
    const recommendation = cloudRecommendation && cloudRecommendation.recommendedPrice ? cloudRecommendation : getLocalPriceRecommendation(data, effectiveProductType);
    if (!recommendation || !recommendation.recommendedPrice || state.insightRecommendationSku !== sku) return;
    state.insightRecommendation = {
      ...recommendation,
      productType,
      effectiveProductType,
      recommendedProductType: recommendation.recommendedProductType || recommendedType || '',
      recommendationReason: recommendation.recommendationReason || buildLocalRecommendationReason(recommendation, effectiveProductType),
    };
    syncInsightEvent('recommendation', {
      sku: data.sku || '',
      brand: data.brand || '',
      name: data.name || '',
      productType: effectiveProductType || productType || '',
      price: String(recommendation.recommendedPrice || ''),
      recommendedPrice: String(recommendation.recommendedPrice || ''),
      source: recommendation.source || 'detail-recommendation',
      reason: state.insightRecommendation.recommendationReason || '',
      recommendationReason: state.insightRecommendation.recommendationReason || '',
      productTypeSource: recommendation.productTypeSource || '',
      productTypeScore: recommendation.productTypeScore || '',
      typeSampleCount: recommendation.typeSampleCount || '',
      recommendedProductType: state.insightRecommendation.recommendedProductType || '',
      effectiveProductType,
      priceConfidence: recommendation.priceConfidence || recommendation.recommendationConfidence || '',
      recommendationConfidence: recommendation.priceConfidence || recommendation.recommendationConfidence || '',
      priceStats: recommendation.priceStats || null,
    });
  }

  function getProductThumbUrl(data) {
    if (!data) return '';
    return /^(?:effectImage|productListImage)$/.test(data.skuImageSource || '') ? (data.skuImageUrl || data.skuImageFallbackUrl || '') : '';
  }

  function scheduleProductThumbHydration(data, options) {
    const opts = options || {};
    const sku = data && data.sku;
    if (!state.settings.collectionEnabled || !sku || !requiresSkuImage(data) || (!opts.refreshImage && getProductThumbUrl(data)) || state.thumbHydratingSku === sku || (!opts.force && state.thumbHydratedSkus.has(sku))) return;
    if (state.scanRunning && !opts.force) return;
    const failedAt = state.thumbHydrateFailedAt && state.thumbHydrateFailedAt[sku] || 0;
    if (!opts.force && failedAt && Date.now() - failedAt < 45000) return;
    state.thumbHydratingSku = sku;
    window.setTimeout(() => hydrateProductThumb(sku).catch((error) => {
      console.warn('PLM floating helper thumbnail hydration failed:', error);
      state.thumbHydrateFailedAt[sku] = Date.now();
    }).finally(() => {
      if (state.thumbHydratingSku === sku) state.thumbHydratingSku = '';
    }), 180);
  }

  function hydrateCurrentProductThumb(options) {
    const data = state.data || (state.selectedSku ? loadData(state.selectedSku) : null);
    if (data && data.sku) scheduleProductThumbHydration(data, options);
  }

  async function hydrateProductThumb(sku) {
    if (!state.settings.collectionEnabled) return;
    const drawer = getProjectDrawerForSku(sku);
    if (!drawer) {
      state.thumbHydrateFailedAt[sku] = Date.now();
      return;
    }
    const current = normalizeData(loadData(sku) || state.data || { sku });
    const isCompleted = /^已完成$/.test(String(current.projectStatus || '').trim());
    const ledgerRecord = (state.ledgerRecords || []).find((item) => item.sku === sku);
    if (!isCompleted) {
      const activeTab = getActiveTabText(drawer);
      let benchmarkInfo = findProjectBenchmarkImageInfo(drawer);
      if (!benchmarkInfo.imageUrl && !benchmarkInfo.imageFallbackUrl) {
        await switchDrawerTab(drawer, '项目信息');
        await wait(180);
        benchmarkInfo = findProjectBenchmarkImageInfo(drawer);
        if (activeTab) await switchDrawerTab(drawer, activeTab);
      }
      const benchmarkSrc = benchmarkInfo.imageUrl || benchmarkInfo.imageFallbackUrl || '';
      if (!benchmarkSrc) {
        state.thumbHydrateFailedAt[sku] = Date.now();
        return;
      }
      const benchmarkData = normalizeData({
        ...current,
        benchmarkImageUrl: benchmarkSrc,
        benchmarkImageFallbackUrl: benchmarkInfo.imageFallbackUrl || benchmarkSrc,
      });
      saveDataDirect(sku, benchmarkData);
      if (state.data && state.data.sku === sku) state.data = benchmarkData;
      if (ledgerRecord) {
        ledgerRecord.benchmarkImageUrl = benchmarkSrc;
        saveDailyLedger();
        refreshLedgerCard(ledgerRecord);
      }
    } else {
      const imageInfo = await collectProductImageInfo(drawer, {
        sku,
        allowPreview: true,
        restoreTab: true,
        designTimeout: 1500,
      });
      if (!getProjectDrawerForSku(sku)) return;
      const src = imageInfo.isSkuDesignImage ? (imageInfo.imageUrl || imageInfo.imageFallbackUrl) : '';
      if (!src) {
        state.thumbHydrateFailedAt[sku] = Date.now();
        return;
      }
      cacheProductThumb(current, { skuImageUrl: src, skuImageFallbackUrl: imageInfo.imageFallbackUrl || src, isSkuDesignImage: true });
      if (ledgerRecord) {
        ledgerRecord.skuImageUrl = src;
        saveDailyLedger();
        refreshLedgerCard(ledgerRecord);
      }
    }
    if (state.thumbHydrateFailedAt) delete state.thumbHydrateFailedAt[sku];
    state.thumbHydratedSkus.add(sku);
    if (state.data && state.data.sku === sku && state.view !== 'ledger' && !updateProductThumbInPlace(state.data)) renderShell();
  }

  function findProjectBenchmarkImageInfo(drawer) {
    if (!drawer) return { imageUrl: '', imageFallbackUrl: '' };
    const scope = Array.from(drawer.querySelectorAll('.ant-form-item, .ant-row, .ant-descriptions-item, .form-item, .previewFormRoot, div'))
      .filter(isVisibleElement)
      .find((el) => /对标图片|项目信息|项目图片|benchmark/i.test(getDesignAssetContext(el))) || drawer;
    const preview = Array.from(scope.querySelectorAll('img, .ant-image, .filePreviewCard, .previewMasker, .preview'))
      .filter(isVisibleElement)
      .find((el) => /对标图片|benchmark|项目图片|预览|图片/i.test(getDesignAssetContext(el)) || /oss-pro\.plm\.westmonth\.cn|ai-obj\.westmonth\.com/.test((el.currentSrc || el.src || '').trim()));
    if (!preview) return { imageUrl: '', imageFallbackUrl: '' };
    const src = preview.currentSrc || preview.src || '';
    return { imageUrl: stripOssResizeParams(src), imageFallbackUrl: src };
  }

  function rowHtml(key, title, value, options) {
    const shown = value || L.unknown;
    const colorClass = /^package(Length|Width|Height)$/.test(key) ? ' is-carton-dim' : (/^product(Length|Width|Height)$/.test(key) ? ' is-product-dim' : '');
    const editButton = options && options.editable ? '<button type="button" data-edit-key="' + escapeHtml(key) + '">' + escapeHtml(L.edit) + '</button>' : '';
    const copyAttr = options && options.noCopy ? '' : ' data-copy-key="' + escapeHtml(key) + '" title="' + escapeHtml(L.copyHint) + '"';
    return '<div class="pfh-row' + colorClass + '"' + copyAttr + ' data-key="' + escapeHtml(key) + '">' +
      '<span class="pfh-label"><span>' + escapeHtml(title) + '</span></span>' +
      '<span class="pfh-value">' + escapeHtml(shown).replace(/\n/g, '<br>') + '</span>' +
      '<span class="pfh-row-actions">' + editButton +
      '</span>' +
      '</div>';
  }

  function rowIconName(key) {
    if (key === 'packageCode') return 'box';
    if (key === 'printCode') return 'tag';
    if (key === 'packageSizeText') return 'list';
    if (key === 'printSizeText') return 'print';
    if (/^(package|product)(Length|Width|Height)$/.test(key)) return 'box';
    return 'bag';
  }

  function excelTriggerHtml() {
    return '<div class="pfh-excel-controls"><button type="button" data-action="copywriting-open"><span>文案</span></button><button type="button" data-action="excel-prepare">' + iconHtml('download') + '<span>' + escapeHtml(L.excel) + '</span></button></div>';
  }

  function excelOptionsHtml() {
    if (!state.excelPanelOpen) {
      return '';
    }
    const status = state.excelStatus || (state.excelMissing.length ? L.excelIncomplete : L.excelReady);
    const statusClass = state.excelMissing.length || !state.excelExtra ? ' is-bad' : ' is-good';
    const priceValue = state.excelPurchasePrice === '' ? '6' : state.excelPurchasePrice;
    const exportLabel = state.exportType === 'toy-label' ? L.exportTypeToyLabel : L.exportTypeExcel;
    return '<div class="pfh-excel-form is-open">' +
      '<div class="pfh-export-menu' + (state.exportMenuOpen ? ' is-open' : '') + '">' +
        '<button type="button" class="pfh-export-menu-button" data-action="export-menu-toggle" aria-expanded="' + (state.exportMenuOpen ? 'true' : 'false') + '">' +
          '<span>' + escapeHtml(exportLabel) + '</span><i></i>' +
        '</button>' +
        '<div class="pfh-export-menu-list">' +
          '<button type="button" data-action="export-type" data-export-type="excel" class="' + (state.exportType === 'excel' ? 'is-active' : '') + '">' + escapeHtml(L.exportTypeExcel) + '</button>' +
          '<button type="button" data-action="export-type" data-export-type="toy-label" class="' + (state.exportType === 'toy-label' ? 'is-active' : '') + '">' + escapeHtml(L.exportTypeToyLabel) + '</button>' +
        '</div>' +
      '</div>' +
      '<input type="number" min="0" step="1" class="pfh-excel-price" placeholder="' + escapeHtml(L.excelPurchasePrice) + '" value="' + escapeHtml(priceValue) + '">' +
      '<button type="button" data-action="excel-prepare" title="' + escapeHtml(L.excelRefresh) + '">' + iconHtml('refresh') + '</button>' +
      '<button type="button" data-action="excel-generate">' + escapeHtml(L.excel) + '</button>' +
      '<span class="pfh-excel-status' + statusClass + '">' + escapeHtml(status) + '</span>' +
      '</div>';
  }

  async function openCopywritingFromCurrent(force) {
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) {
      showToast('请先选择一个产品');
      return;
    }
    const sku = data.sku;
    state.copywritingMode = true;
    state.copywritingLoading = true;
    state.copywritingError = '';
    state.copywritingStatus = '正在打开设计资料...';
    stopScan();
    stopMaterialWatch();
    expandPanel();
    renderShell();
    addLog('info', '产品文案：开始读取', sku + (force ? ' 重新获取' : ''));
    try {
      let drawer = getProjectDrawerForSku(sku);
      if (!drawer) {
        await openSelectedProjectDetail();
        drawer = await waitFor(() => getProjectDrawerForSku(sku), 6000, 150);
      }
      if (!drawer) throw new Error('未打开当前编码的项目详情');
      stopScan();
      state.copywritingStatus = '正在定位设计资料里的产品文案...';
      renderShell();
      await switchDrawerTab(drawer, '设计资料');
      const designReady = await waitFor(() => {
        const tab = findTabButton(drawer, '设计资料');
        return tab && isActiveTab(tab);
      }, 5000, 120);
      if (!designReady) throw new Error('无法切换到设计资料');
      const item = await waitFor(() => findProductCopywritingItem(drawer), 5000, 160);
      if (!item) throw new Error('设计资料中未找到“产品文案”字段');
      const file = findProductCopywritingFile(item, sku);
      if (!file) throw new Error('产品文案字段中未找到当前编码的 Word 文件');
      const workingData = normalizeData(loadData(sku) || state.data || data);
      const cached = normalizeCopywritingRecord(workingData.copywriting);
      const fileTimestamp = extractCopywritingFileTimestamp(file.fileName);
      if (cached && cached.fileTimestamp && fileTimestamp && fileTimestamp < cached.fileTimestamp) {
        state.copywritingError = '页面中的 Word 版本早于缓存，已保留较新的文案';
        addLog('warn', '产品文案：检测到旧附件', file.fileName + ' < ' + cached.fileName);
        return;
      }
      state.copywritingStatus = '正在触发 Word 下载 ' + file.fileName;
      renderShell();
      let source = await withCopywritingTimeout(resolveCopywritingDocumentSource(file.card, file.fileName), 12000, 'Word 下载监听');
      if (!source || (!source.url && !source.arrayBuffer)) throw new Error('未读取到 Word 文件内容');
      addLog('info', '产品文案：已取得文件内容', source.arrayBuffer ? '内存 Word 数据' : String(source.url || '').replace(/\?.*$/, '?...'));
      let arrayBuffer;
      try {
        state.copywritingStatus = source.arrayBuffer ? '正在校验 Word 文件...' : '正在读取 Word 文件...';
        renderShell();
        arrayBuffer = source.arrayBuffer || await withCopywritingTimeout(downloadCopywritingDocument(source.url), 18000, 'Word 文件读取');
        if (!isCopywritingDocxBuffer(arrayBuffer)) throw new Error('读取到的内容不是有效 Word 文件');
      } catch (error) {
        if (source.kind === 'captured') throw error;
        addLog('warn', '产品文案：组件地址不可直接读取，改用下载监听', formatErrorMessage(error));
        state.copywritingStatus = '正在重新监听 Word 下载...';
        renderShell();
        source = { ...(await withCopywritingTimeout(captureCopywritingDownloadSource(file.card, file.fileName), 12000, '备用下载监听')), kind: 'captured' };
        if (!source.url && !source.arrayBuffer) throw error;
        state.copywritingStatus = source.arrayBuffer ? '正在校验 Word 文件...' : '正在读取 Word 文件...';
        renderShell();
        arrayBuffer = source.arrayBuffer || await withCopywritingTimeout(downloadCopywritingDocument(source.url), 18000, '备用 Word 文件读取');
        if (!isCopywritingDocxBuffer(arrayBuffer)) throw new Error('下载监听取得的内容不是有效 Word 文件');
      }
      const fileHash = await hashCopywritingBuffer(arrayBuffer);
      state.copywritingStatus = '正在解析 Word 表格...';
      renderShell();
      addLog('info', '产品文案：开始解析 Word', file.fileName + ' | ' + arrayBuffer.byteLength + 'B');
      const tableRows = await withCopywritingTimeout(parseCopywritingDocxRows(arrayBuffer), 20000, 'Word 表格解析');
      const built = buildMainstreamCopywriting(tableRows, workingData);
      if (!built.sections.length) throw new Error('Word 中未识别到主流版文案字段');
      const next = buildCopywritingRecord(file.fileName, fileTimestamp, fileHash, built, cached);
      saveData(sku, { ...workingData, copywriting: next });
      state.copywritingStatus = '';
      state.copywritingError = '';
      const updated = Boolean(cached && cached.fullText && next.updatePending && (
        next.fileHash !== cached.fileHash
        || next.fileName !== cached.fileName
        || next.fullText !== cached.fullText
      ));
      addLog('info', updated ? '产品文案：检测到更新' : '产品文案：读取成功', file.fileName + ' ' + built.sections.length + '段');
      showToast(updated ? '文案已更新，差异已高亮' : '文案读取成功');
    } catch (error) {
      state.copywritingError = formatErrorMessage(error) || '产品文案读取失败';
      addLog('error', '产品文案读取失败', sku + ' ' + state.copywritingError);
      showToast('产品文案读取失败');
    } finally {
      state.copywritingLoading = false;
      renderShell();
    }
  }

  function acknowledgeCopywritingUpdate() {
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    const record = normalizeCopywritingRecord(data && data.copywriting);
    if (!data || !data.sku || !record) return;
    const next = {
      ...record,
      updatePending: false,
      changedSectionKeys: [],
      removedSections: [],
      previousSections: [],
    };
    saveData(data.sku, { ...data, copywriting: next });
    showToast('已标记为查看');
    renderShell();
  }

  function findProductCopywritingItem(drawer) {
    if (!drawer) return null;
    return Array.from(drawer.querySelectorAll('.ant-form-item'))
      .filter(isVisibleElement)
      .find((item) => {
        const label = item.querySelector('.ant-form-item-label');
        return compactText(label && (label.innerText || label.textContent)).replace(/[：:*]/g, '') === '产品文案';
      }) || null;
  }

  function findProductCopywritingFile(item, sku) {
    const cards = Array.from(item.querySelectorAll('.filePreviewMainBox, .filePreviewCard, .removeOtherContent'))
      .filter(isVisibleElement)
      .map((card) => ({ card, fileName: extractCopywritingFileName(card) }))
      .filter((entry) => /\.docx$/i.test(entry.fileName));
    const unique = cards.filter((entry, index) => cards.findIndex((candidate) => candidate.fileName === entry.fileName) === index);
    if (!unique.length) return null;
    const skuMatches = unique.filter((entry) => !sku || new RegExp(escapeRegExp(sku), 'i').test(entry.fileName));
    const pool = skuMatches.length ? skuMatches : (unique.length === 1 ? unique : []);
    if (!pool.length) return null;
    return pool.sort((a, b) => extractCopywritingFileTimestamp(b.fileName).localeCompare(extractCopywritingFileTimestamp(a.fileName)))[0];
  }

  function extractCopywritingFileName(card) {
    if (!card) return '';
    const titleSpans = Array.from(card.querySelectorAll('.title span, [class*="title"] span'))
      .map((el) => compactText(el.innerText || el.textContent))
      .filter((text) => /\.docx$/i.test(text));
    if (titleSpans.length) return titleSpans[titleSpans.length - 1];
    return ((compactText(card.innerText || card.textContent).match(/[^\n\\/:*?"<>|]+\.docx\b/i) || [])[0] || '').trim();
  }

  function extractCopywritingFileTimestamp(fileName) {
    return ((String(fileName || '').match(/_(\d{14,17})(?=\.docx$)/i) || [])[1] || '');
  }

  async function resolveCopywritingDocumentSource(card, fileName) {
    const direct = findCopywritingUrlInCard(card);
    if (direct) {
      addLog('info', '产品文案：命中卡片地址', fileName + ' | ' + redactCopywritingUrl(direct));
      return { url: direct, arrayBuffer: null, kind: 'direct' };
    }
    addLog('info', '产品文案：未发现静态地址，直接监听下载动作', fileName);
    return { ...(await captureCopywritingDownloadSource(card, fileName)), kind: 'captured' };
  }

  function withCopywritingTimeout(promise, timeout, stage) {
    let timer = null;
    const limit = new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error((stage || '产品文案处理') + '超时')), Math.max(1000, Number(timeout) || 12000));
    });
    return Promise.race([Promise.resolve(promise), limit]).finally(() => {
      if (timer) clearTimeout(timer);
    });
  }

  function redactCopywritingUrl(value) {
    return String(value || '').replace(/\?.*$/, '?...').slice(0, 500);
  }

  function findCopywritingUrlInCard(card) {
    if (!card) return '';
    const attrs = ['href', 'src', 'data-url', 'data-src', 'data-file-url', 'data-download-url', 'download-url'];
    const nodes = [card].concat(Array.from(card.querySelectorAll('*')));
    for (const node of nodes) {
      for (const name of attrs) {
        const value = node.getAttribute && node.getAttribute(name);
        const url = normalizeCopywritingUrl(value);
        if (url && isUsableCopywritingUrl(url)) return url;
      }
    }
    const html = String(card.outerHTML || '').replace(/&amp;/g, '&');
    const urls = html.match(/https?:\/\/[^"'<>\s]+/g) || [];
    return urls.map(normalizeCopywritingUrl).find(isUsableCopywritingUrl) || '';
  }

  function normalizeCopywritingUrl(value) {
    const text = String(value || '').trim().replace(/&amp;/g, '&').replace(/\\\//g, '/');
    if (!text || /^(?:data:|javascript:)/i.test(text) || /filePic\/word\.png/i.test(text)) return '';
    if (/^(?:https?:|blob:)/i.test(text)) return text;
    if (/^\/\//.test(text)) return location.protocol + text;
    if (/^\//.test(text)) return location.origin + text;
    return '';
  }

  function isUsableCopywritingUrl(url) {
    const text = String(url || '');
    return /^blob:/i.test(text) || (/^https?:/i.test(text) && /(?:\.docx(?:\?|$)|download|attachment)/i.test(text));
  }

  function scoreCopywritingUrl(url, fileName) {
    const text = String(url || '').toLowerCase();
    if (!text || /filepic\/word\.png|data:image/i.test(text)) return -100;
    let score = /^(?:https?:|blob:)/i.test(text) ? 1 : 0;
    if (/^blob:/i.test(text)) score += 100;
    if (/\.docx(?:\?|$)/i.test(text)) score += 90;
    if (/download|attachment/i.test(text)) score += 45;
    if (/file(?:\/|=|\?|_)/i.test(text)) score += 18;
    if (/oss|object|storage/i.test(text)) score += 10;
    const normalizedName = String(fileName || '').toLowerCase();
    if (normalizedName && (text.includes(normalizedName) || text.includes(encodeURIComponent(normalizedName).toLowerCase()))) score += 80;
    return score;
  }

  function findCopywritingUrlInVueState(card, fileName) {
    if (!card) return '';
    const roots = [];
    let element = card;
    for (let level = 0; element && level < 6; level += 1, element = element.parentElement) {
      try {
        Object.getOwnPropertyNames(element).filter((key) => /^__vue/i.test(key)).forEach((key) => roots.push(element[key]));
      } catch (error) { /* no-op */ }
    }
    const queue = [];
    roots.forEach((instance) => {
      if (!instance || typeof instance !== 'object') return;
      ['props', 'setupState', 'data', 'ctx', 'attrs'].forEach((key) => {
        try { if (instance[key]) queue.push({ value: instance[key], depth: 0, key }); } catch (error) { /* no-op */ }
      });
      try { if (instance.vnode && instance.vnode.props) queue.push({ value: instance.vnode.props, depth: 0, key: 'vnode.props' }); } catch (error) { /* no-op */ }
    });
    const seen = new Set();
    const candidates = [];
    let inspected = 0;
    const addCandidate = (value, key, sameFileObject) => {
      const raw = String(value || '').replace(/\\u002f/gi, '/').replace(/\\\//g, '/');
      const values = [raw].concat(raw.match(/https?:\/\/[^"'<>\s]+/gi) || []);
      values.forEach((candidate) => {
        const url = normalizeCopywritingUrl(candidate);
        if (!url) return;
        const baseScore = scoreCopywritingUrl(url, fileName);
        const score = baseScore + (/url|path|download|file/i.test(String(key || '')) ? 20 : 0) + (sameFileObject ? 40 : 0);
        if (baseScore > 20 || sameFileObject) candidates.push({ url, score });
      });
    };
    while (queue.length && inspected < 700) {
      const entry = queue.shift();
      const value = entry.value;
      inspected += 1;
      if (typeof value === 'string') {
        addCandidate(value, entry.key, false);
        continue;
      }
      if (!value || typeof value !== 'object' || entry.depth >= 5 || seen.has(value)) continue;
      if (value.nodeType || value === window || value === document) continue;
      seen.add(value);
      let keys = [];
      try { keys = Object.keys(value).slice(0, 80); } catch (error) { continue; }
      const normalizedName = String(fileName || '').toLowerCase();
      const sameFileObject = Boolean(normalizedName && keys.some((key) => {
        try { return typeof value[key] === 'string' && String(value[key]).toLowerCase().includes(normalizedName); } catch (error) { return false; }
      }));
      keys.forEach((key) => {
        if (/^(?:parent|root|appContext|subTree|component|el|proxy|provides)$/i.test(key)) return;
        let child;
        try { child = value[key]; } catch (error) { return; }
        if (typeof child === 'string') addCandidate(child, key, sameFileObject);
        else if (child && typeof child === 'object') queue.push({ value: child, depth: entry.depth + 1, key });
      });
    }
    return candidates.sort((a, b) => b.score - a.score)[0]?.url || '';
  }

  async function captureCopywritingDownloadSource(card, fileName) {
    if (!card) {
      addLog('error', '产品文案：下载监听失败', '附件卡片不存在');
      return { url: '', arrayBuffer: null };
    }
    // PLM only reveals this control on hover, but HTMLElement.click() works while it is hidden.
    const control = card.querySelector('.delBtn .anticon-vertical-align-bottom, .delBtn [aria-label="vertical-align-bottom"], .anticon-vertical-align-bottom, [aria-label="vertical-align-bottom"], [class*="download" i]');
    const clickable = control && (control.closest('.delBtn, button, a, [role="button"]') || control);
    if (!clickable) {
      addLog('error', '产品文案：下载监听失败', fileName + ' | 未找到下载图标，卡片类名：' + String(card.className || ''));
      return { url: '', arrayBuffer: null };
    }
    let captured = '';
    let capturedScore = -100;
    let capturedAt = 0;
    let capturedReady = false;
    let capturedBuffer = null;
    const root = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    const restores = [];
    const trace = [];
    const capture = (value, bonus, ready) => {
      const url = normalizeCopywritingUrl(value);
      const score = scoreCopywritingUrl(url, fileName) + Number(bonus || 0);
      if (!url || (score < 25 && !ready)) return false;
      if (url && score > capturedScore) {
        captured = url;
        capturedScore = score;
        capturedAt = Date.now();
        capturedReady = Boolean(ready);
        trace.push('地址:' + redactCopywritingUrl(url));
      }
      return Boolean(url);
    };
    const captureBuffer = (value) => {
      if (!value) return;
      const convert = Object.prototype.toString.call(value) === '[object ArrayBuffer]'
        ? Promise.resolve(value)
        : (typeof value.arrayBuffer === 'function' ? value.arrayBuffer() : Promise.resolve(null));
      convert.then((buffer) => {
        if (!buffer || !buffer.byteLength) return;
        const bytes = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength));
        if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
          capturedBuffer = buffer;
          trace.push('内存Word:' + buffer.byteLength + 'B');
        } else trace.push('非Word响应:' + buffer.byteLength + 'B');
      }).catch(() => {});
    };
    try {
      const anchorProto = root.HTMLAnchorElement && root.HTMLAnchorElement.prototype;
      if (anchorProto && anchorProto.click) {
        const originalAnchorClick = anchorProto.click;
        anchorProto.click = function () {
          const url = this.href || this.getAttribute('href') || '';
          if (capture(url, 70, true)) return;
          return originalAnchorClick.apply(this, arguments);
        };
        restores.push(() => { anchorProto.click = originalAnchorClick; });
      }
      if (typeof root.open === 'function') {
        const originalOpen = root.open;
        root.open = function (url) {
          if (capture(url, 70, true)) return null;
          return originalOpen.apply(this, arguments);
        };
        restores.push(() => { root.open = originalOpen; });
      }
      if (root.URL && typeof root.URL.createObjectURL === 'function') {
        const originalCreate = root.URL.createObjectURL;
        root.URL.createObjectURL = function () {
          const url = originalCreate.apply(this, arguments);
          captureBuffer(arguments[0]);
          capture(url, 100, true);
          return url;
        };
        restores.push(() => { root.URL.createObjectURL = originalCreate; });
      }
      if (root.URL && typeof root.URL.revokeObjectURL === 'function') {
        const originalRevoke = root.URL.revokeObjectURL;
        root.URL.revokeObjectURL = function (url) {
          if (captured && String(url || '') === captured) return;
          return originalRevoke.apply(this, arguments);
        };
        restores.push(() => { root.URL.revokeObjectURL = originalRevoke; });
      }
      if (typeof root.fetch === 'function') {
        const originalFetch = root.fetch;
        root.fetch = function (input) {
          const requestUrl = typeof input === 'string' ? input : (input && input.url) || '';
          capture(requestUrl, 15, false);
          const result = originalFetch.apply(this, arguments);
          result.then((response) => {
            const disposition = response.headers && response.headers.get ? (response.headers.get('content-disposition') || '') : '';
            const contentType = response.headers && response.headers.get ? (response.headers.get('content-type') || '') : '';
            capture(response.url || requestUrl, 25, false);
            if (/docx|officedocument|octet-stream|attachment/i.test(disposition + ' ' + contentType + ' ' + requestUrl)) {
              try { captureBuffer(response.clone()); } catch (error) { /* no-op */ }
            }
          }).catch(() => {});
          return result;
        };
        restores.push(() => { root.fetch = originalFetch; });
      }
      const xhrProto = root.XMLHttpRequest && root.XMLHttpRequest.prototype;
      if (xhrProto && xhrProto.open && xhrProto.send) {
        const originalXhrOpen = xhrProto.open;
        const originalXhrSend = xhrProto.send;
        xhrProto.open = function (method, url) {
          this.__pfhCopywritingUrl = String(url || '');
          capture(url, 15, false);
          return originalXhrOpen.apply(this, arguments);
        };
        xhrProto.send = function () {
          const xhr = this;
          const requestUrl = xhr.__pfhCopywritingUrl || '';
          xhr.addEventListener('load', () => {
            let disposition = '';
            let contentType = '';
            try {
              disposition = xhr.getResponseHeader('content-disposition') || '';
              contentType = xhr.getResponseHeader('content-type') || '';
            } catch (error) { /* no-op */ }
            capture(xhr.responseURL || requestUrl, 25, false);
            if (/docx|officedocument|octet-stream|attachment/i.test(disposition + ' ' + contentType + ' ' + requestUrl)) captureBuffer(xhr.response);
          }, { once: true });
          return originalXhrSend.apply(this, arguments);
        };
        restores.push(() => {
          xhrProto.open = originalXhrOpen;
          xhrProto.send = originalXhrSend;
        });
      }
    } catch (error) {
      addLog('warn', '产品文案：下载地址监听受限', formatErrorMessage(error));
    }
    const before = new Set((performance.getEntriesByType && performance.getEntriesByType('resource') || []).map((entry) => entry.name));
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => Array.from(mutation.addedNodes || []).forEach((node) => {
        if (!node || node.nodeType !== 1) return;
        capture(node.href || (node.getAttribute && (node.getAttribute('href') || node.getAttribute('src'))) || '', 45, true);
        if (!captured && node.querySelectorAll) {
          Array.from(node.querySelectorAll('a[href], [src]')).some((el) => capture(el.href || el.src || '', 45, true));
        }
      }));
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    try {
      clickElement(clickable);
      trace.push('已点击:' + String(clickable.className || clickable.getAttribute('aria-label') || clickable.tagName));
      const observed = await waitUntil(() => {
        if (capturedBuffer) return 'buffer';
        if (captured && capturedReady) return 'url';
        const resources = (performance.getEntriesByType && performance.getEntriesByType('resource') || [])
          .map((entry) => entry.name)
          .filter((name) => !before.has(name));
        resources.forEach((url) => capture(url, 20, false));
        if (captured && capturedAt && Date.now() - capturedAt > 6500) return 'url';
        return '';
      }, 9000, 100);
      if (!observed && captured) capturedReady = true;
    } finally {
      observer.disconnect();
      restores.reverse().forEach((restore) => {
        try { restore(); } catch (error) { /* no-op */ }
      });
    }
    if (capturedBuffer) addLog('info', '产品文案：下载监听成功', fileName + ' | 内存 Word ' + capturedBuffer.byteLength + 'B');
    else if (captured) addLog('info', '产品文案：下载监听捕获地址', fileName + ' | ' + redactCopywritingUrl(captured));
    else addLog('error', '产品文案：下载监听未取得文件', fileName + ' | ' + (trace.join('；') || '点击后未发现下载地址、Blob 或 Word 响应'));
    return { url: captured, arrayBuffer: capturedBuffer };
  }

  function downloadCopywritingDocument(url) {
    if (/^blob:/i.test(url)) {
      return fetch(url).then((response) => {
        if (!response.ok) throw new Error('Word 下载失败：' + response.status);
        return response.arrayBuffer();
      }).finally(() => {
        try { URL.revokeObjectURL(url); } catch (error) { /* no-op */ }
      });
    }
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest !== 'function') {
        fetch(url).then((response) => {
          if (!response.ok) throw new Error('Word 下载失败：' + response.status);
          return response.arrayBuffer();
        }).then(resolve, reject);
        return;
      }
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        responseType: 'arraybuffer',
        timeout: 20000,
        onload: (response) => {
          if (response.status < 200 || response.status >= 300) {
            reject(new Error('Word 下载失败：HTTP ' + response.status));
            return;
          }
          if (response.response instanceof ArrayBuffer) resolve(response.response);
          else if (response.response && response.response.arrayBuffer) response.response.arrayBuffer().then(resolve, reject);
          else reject(new Error('Word 下载内容为空'));
        },
        onerror: () => reject(new Error('Word 下载请求失败')),
        ontimeout: () => reject(new Error('Word 下载超时')),
      });
    });
  }

  function isCopywritingDocxBuffer(arrayBuffer) {
    if (!arrayBuffer || arrayBuffer.byteLength < 4) return false;
    const bytes = new Uint8Array(arrayBuffer, 0, 4);
    return bytes[0] === 0x50 && bytes[1] === 0x4b;
  }

  async function parseCopywritingDocxRows(arrayBuffer) {
    let xmlText = '';
    try {
      xmlText = await readDocxDocumentXmlNative(arrayBuffer);
      addLog('info', '产品文案：Word 原生解压成功', xmlText.length + ' 字符');
    } catch (nativeError) {
      addLog('warn', '产品文案：原生解压不可用，尝试 JSZip', formatErrorMessage(nativeError));
      const Zip = (typeof JSZip !== 'undefined' && JSZip) || (typeof unsafeWindow !== 'undefined' && unsafeWindow.JSZip);
      if (!Zip) throw new Error('Word 解析组件未加载，且原生解压失败：' + formatErrorMessage(nativeError));
      const zip = await Zip.loadAsync(arrayBuffer, { checkCRC32: false, createFolders: false });
      const documentFile = zip.file('word/document.xml');
      if (!documentFile) throw new Error('Word 文件结构不完整');
      xmlText = await documentFile.async('string');
      addLog('info', '产品文案：JSZip 解压成功', xmlText.length + ' 字符');
    }
    const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (xml.querySelector('parsererror')) throw new Error('Word XML 解析失败');
    const rows = [];
    Array.from(xml.getElementsByTagNameNS('*', 'tr')).forEach((row) => {
      const cells = Array.from(row.children || []).filter((node) => node.localName === 'tc').map(copywritingCellLines);
      if (cells.length >= 2) rows.push(cells);
    });
    return rows;
  }

  async function readDocxDocumentXmlNative(arrayBuffer) {
    if (typeof DecompressionStream !== 'function') throw new Error('浏览器不支持原生 ZIP 解压');
    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const readU16 = (offset) => view.getUint16(offset, true);
    const readU32 = (offset) => view.getUint32(offset, true);
    let eocd = -1;
    const start = Math.max(0, bytes.length - 65557);
    for (let offset = bytes.length - 22; offset >= start; offset -= 1) {
      if (readU32(offset) === 0x06054b50) {
        eocd = offset;
        break;
      }
    }
    if (eocd < 0) throw new Error('未找到 Word ZIP 目录');
    const entryCount = readU16(eocd + 10);
    let offset = readU32(eocd + 16);
    const decoder = new TextDecoder('utf-8');
    for (let index = 0; index < entryCount; index += 1) {
      if (offset + 46 > bytes.length || readU32(offset) !== 0x02014b50) throw new Error('Word ZIP 目录损坏');
      const compression = readU16(offset + 10);
      const compressedSize = readU32(offset + 20);
      const nameLength = readU16(offset + 28);
      const extraLength = readU16(offset + 30);
      const commentLength = readU16(offset + 32);
      const localOffset = readU32(offset + 42);
      const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
      offset += 46 + nameLength + extraLength + commentLength;
      if (name !== 'word/document.xml') continue;
      if (localOffset + 30 > bytes.length || readU32(localOffset) !== 0x04034b50) throw new Error('Word 正文位置无效');
      const localNameLength = readU16(localOffset + 26);
      const localExtraLength = readU16(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);
      if (compression === 0) return decoder.decode(compressed);
      if (compression !== 8) throw new Error('Word 使用了不支持的压缩方式：' + compression);
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      const inflated = await new Response(stream).arrayBuffer();
      return decoder.decode(new Uint8Array(inflated));
    }
    throw new Error('Word 中没有正文 XML');
  }

  function copywritingCellLines(cell) {
    return Array.from(cell.getElementsByTagNameNS('*', 'p'))
      .map((paragraph) => Array.from(paragraph.getElementsByTagNameNS('*', 't')).map((node) => node.textContent || '').join(''))
      .map(cleanCopywritingLine)
      .filter(Boolean);
  }

  function cleanCopywritingLine(value) {
    return String(value || '').replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ').replace(/[ \t]+/g, ' ').trim();
  }

  function buildMainstreamCopywriting(rows, data) {
    const rowMap = {};
    (rows || []).forEach((cells) => {
      const label = cleanCopywritingLine((cells[0] || []).join('')).replace(/\s+/g, '');
      if (label && !rowMap[label]) rowMap[label] = cells[1] || [];
    });
    const find = (pattern) => {
      const key = Object.keys(rowMap).find((label) => pattern.test(label));
      return key ? rowMap[key].slice() : [];
    };
    const sections = [];
    const missingSections = [];
    const add = (key, label, text) => {
      const value = String(text || '').trim();
      if (value) sections.push({ key, label, text: value.slice(0, 12000) });
      else missingSections.push(label);
    };
    const productSection = preserveCopywritingHeading(find(/^产品名称$/), /^PRODUCT\s+NAME\s*[:：]?$/i, 'PRODUCT NAME:');
    add('productName', '产品名称', joinCopywritingSection(productSection.heading, productSection.lines));
    const functionsHeading = find(/^24国语言功效标题/).join('').trim();
    add('functionsHeading', '24国语言功效标题', functionsHeading);
    const functionLines = find(/^24国语言功效内容/).map((line) => line.replace(/;\s*$/, '').trim()).filter(Boolean);
    add('functions', '24国语言功效内容', functionLines.join(';  '));
    const ingredientLines = find(/^(?:成分表|成分活性非活性成分)/);
    const activeIngredients = extractLabeledCopywritingSection(ingredientLines, /\bACTIVE\s+INGREDIENTS?\s*[:：]?/i, /\bINACTIVE\s+INGREDIENTS?\s*[:：]?/i, 'ACTIVE INGREDIENTS:');
    const inactiveIngredients = extractLabeledCopywritingSection(ingredientLines, /\bINACTIVE\s+INGREDIENTS?\s*[:：]?/i, null, 'INACTIVE INGREDIENTS:');
    if (activeIngredients.lines.length || inactiveIngredients.lines.length) {
      add('activeIngredients', 'ACTIVE INGREDIENTS', joinCopywritingSection(activeIngredients.heading, activeIngredients.lines));
      add('inactiveIngredients', 'INACTIVE INGREDIENTS', joinCopywritingSection(inactiveIngredients.heading, inactiveIngredients.lines));
    } else {
      const ingredientSection = preserveCopywritingHeading(ingredientLines, /^INGREDIENTS?\s*[:：]?$/i, 'INGREDIENTS:');
      add('ingredients', '成分表', joinCopywritingSection(ingredientSection.heading, ingredientSection.lines));
    }
    const directionSection = preserveCopywritingHeading(find(/^(?:[AB][.．、]?\s*)?建议使用方法|^使用方法/i), /^DIRECTIONS(?:\s+OF\s+SAFE\s+USE)?\s*[:：]?$/i, 'DIRECTIONS:');
    add('directions', '建议使用方法', joinCopywritingSection(directionSection.heading, directionSection.lines));
    const warningSection = preserveCopywritingHeading(find(/^警告语$/), /^WARNINGS?\s*[:：]?$/i, 'WARNINGS:');
    add('warning', '警告语', joinCopywritingSection(warningSection.heading, warningSection.lines));
    const emailLines = find(/^美国不良事故联系人邮箱$/);
    const emailSection = preserveCopywritingHeading(emailLines, /^E-?MAIL\s*[:：]?$/i, 'e-mail:');
    add('email', '联系邮箱', joinCopywritingSection(emailSection.heading, emailSection.lines));
    const net = formatCopywritingNetContent(data && data.netContent);
    if (net.warning && net.text) missingSections.push(net.warning);
    add('netContent', '净含量', net.text);
    const originLines = find(/^原产国$/);
    add('origin', '原产国', originLines.join('\n'));
    const shelfLines = find(/^保质期$/);
    add('shelfLife', '保质期', shelfLines.join('\n'));
    formatBrandComplianceSections(data).forEach((section) => add(section.key, section.label, section.text));
    return { sections, fullText: sections.map((section) => section.text).join('\n'), missingSections };
  }

  function findBrandCompliance(data) {
    const brand = String(data && data.brand || '').replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
    if (!brand) return null;
    return BRAND_COMPLIANCE_DATA.find((item) => String(item && item.brand || '').replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase() === brand) || null;
  }

  function cleanComplianceValue(value) {
    return String(value || '').replace(/\u00a0/g, ' ').replace(/\r/g, '').split('\n').map((line) => line.trim()).filter(Boolean).join('\n').trim();
  }

  function formatBrandComplianceSections(data) {
    const info = findBrandCompliance(data);
    if (!info || !cleanComplianceValue(info.distributed_by)) return [];
    const sections = [
      { key: 'distributedBy', label: 'DISTRIBUTED BY', text: 'DISTRIBUTED BY: ' + cleanComplianceValue(info.distributed_by) },
      { key: 'address', label: 'ADDRESS', text: 'ADDRESS: ' + cleanComplianceValue(info.address) },
    ];
    [['EU REP', 'euRep', info.eu_rep], ['UK REP', 'ukRep', info.uk_rep], ['US REP', 'usRep', info.us_rep]].forEach(([label, key, rep]) => {
      if (!rep || !cleanComplianceValue(rep.company)) return;
      const lines = [cleanComplianceValue(rep.company), cleanComplianceValue(rep.address), cleanComplianceValue(rep.contact), cleanComplianceValue(rep.phone), cleanComplianceValue(rep.postal_code)].filter(Boolean);
      if (lines.length) sections.push({ key, label, text: label + '\n' + lines.join('\n') });
    });
    return sections;
  }

  function extractLabeledCopywritingSection(lines, headingPattern, nextHeadingPattern, fallbackHeading) {
    const text = (lines || []).map(cleanCopywritingLine).filter(Boolean).join('\n');
    const match = text.match(headingPattern);
    if (!match) return { heading: fallbackHeading, lines: [] };
    const start = Number(match.index) || 0;
    const heading = String(match[0] || '').trim() || fallbackHeading;
    let value = text.slice(start + match[0].length).replace(/^\s*[:：]\s*/, '');
    if (nextHeadingPattern) {
      const next = value.search(nextHeadingPattern);
      if (next >= 0) value = value.slice(0, next);
    }
    return { heading, lines: value.split(/\r?\n/).map(cleanCopywritingLine).filter(Boolean) };
  }

  function preserveCopywritingHeading(lines, headingPattern, fallbackHeading) {
    const result = (lines || []).map(cleanCopywritingLine).filter(Boolean);
    if (!result.length) return { heading: fallbackHeading, lines: [] };
    const first = result[0];
    const colonIndex = first.search(/[:：]/);
    const prefix = colonIndex >= 0 ? first.slice(0, colonIndex + 1).trim() : first.trim();
    const hasExpectedHeading = headingPattern.test(first) || (colonIndex >= 0 && headingPattern.test(prefix));
    const hasSourceHeading = colonIndex >= 0 && /^[A-Z][A-Z0-9 /().&-]*[:：]$/.test(prefix);
    if (!hasExpectedHeading && !hasSourceHeading) {
      return { heading: fallbackHeading, lines: result };
    }
    const body = colonIndex >= 0 ? first.slice(colonIndex + 1).trim() : '';
    result.shift();
    if (body) result.unshift(body);
    return { heading: prefix || fallbackHeading, lines: result };
  }

  function joinCopywritingSection(heading, lines) {
    const body = (lines || []).map(cleanCopywritingLine).filter(Boolean);
    return body.length ? [heading].concat(body).join('\n') : '';
  }

  function formatCopywritingNetContent(value) {
    const text = cleanCopywritingLine(value);
    if (!text || text === '--' || text === L.unknown) return { text: '', warning: '净含量' };
    if (/^\d+(?:\.\d+)?PC$/i.test(text)) return { text: text.toUpperCase(), warning: '' };
    const match = text.match(/(\d+(?:\.\d+)?)\s*(g|ml)\b/i);
    if (!match) return { text, warning: '净含量单位无法换算' };
    const amount = Number(match[1]);
    const unit = match[2].toUpperCase();
    if (!Number.isFinite(amount)) return { text, warning: '净含量单位无法换算' };
    const imperial = unit === 'G' ? amount / 28.349523125 : amount / 29.5735295625;
    return { text: trimNumber(amount) + unit + '/ ' + imperial.toFixed(2) + (unit === 'G' ? ' OZ' : ' FL OZ'), warning: '' };
  }

  async function hashCopywritingBuffer(arrayBuffer) {
    try {
      const digest = await crypto.subtle.digest('SHA-256', arrayBuffer.slice(0));
      return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      const bytes = new Uint8Array(arrayBuffer);
      let hash = 2166136261;
      for (let index = 0; index < bytes.length; index += 1) hash = Math.imul(hash ^ bytes[index], 16777619);
      return (hash >>> 0).toString(16);
    }
  }

  function buildCopywritingRecord(fileName, fileTimestamp, fileHash, built, cached) {
    const now = new Date().toLocaleString();
    const old = normalizeCopywritingRecord(cached);
    const changedFile = Boolean(old && old.fullText && (
      old.fileHash !== fileHash
      || old.fileName !== fileName
      || old.fullText !== built.fullText
    ));
    const oldMap = new Map((old && old.sections || []).map((section) => [section.key, section]));
    const nextMap = new Map((built.sections || []).map((section) => [section.key, section]));
    const changedSectionKeys = changedFile
      ? built.sections.filter((section) => !oldMap.has(section.key) || oldMap.get(section.key).text !== section.text).map((section) => section.key)
      : (old && old.updatePending ? old.changedSectionKeys.slice() : []);
    const removedSections = changedFile
      ? (old.sections || []).filter((section) => !nextMap.has(section.key)).map((section) => section.label || section.key)
      : (old && old.updatePending ? old.removedSections.slice() : []);
    return normalizeCopywritingRecord({
      fileName,
      fileTimestamp,
      fileHash,
      fetchedAt: now,
      sections: built.sections,
      fullText: built.fullText,
      missingSections: built.missingSections,
      updatePending: changedFile || Boolean(old && old.updatePending),
      changedSectionKeys,
      removedSections,
      previousSections: changedFile ? old.sections : (old && old.updatePending ? old.previousSections : []),
    });
  }

  function normalizeCopywritingRecord(record) {
    if (!record || typeof record !== 'object') return null;
    const normalizeSections = (items) => (Array.isArray(items) ? items : []).slice(0, 16).map((section) => ({
      key: String(section && section.key || '').slice(0, 60),
      label: String(section && section.label || '').slice(0, 100),
      text: String(section && section.text || '').slice(0, 12000),
    })).filter((section) => section.key && section.text);
    return {
      fileName: String(record.fileName || '').slice(0, 300),
      fileTimestamp: String(record.fileTimestamp || '').slice(0, 20),
      fileHash: String(record.fileHash || '').slice(0, 128),
      fetchedAt: String(record.fetchedAt || '').slice(0, 80),
      sections: normalizeSections(record.sections),
      fullText: String(record.fullText || '').slice(0, 50000),
      missingSections: (Array.isArray(record.missingSections) ? record.missingSections : []).map((item) => String(item || '').slice(0, 100)).filter(Boolean).slice(0, 16),
      updatePending: Boolean(record.updatePending),
      changedSectionKeys: (Array.isArray(record.changedSectionKeys) ? record.changedSectionKeys : []).map((item) => String(item || '').slice(0, 60)).filter(Boolean).slice(0, 16),
      removedSections: (Array.isArray(record.removedSections) ? record.removedSections : []).map((item) => String(item || '').slice(0, 100)).filter(Boolean).slice(0, 16),
      previousSections: normalizeSections(record.previousSections),
    };
  }

  function uploadPanelHtml() {
    state.uploadExpanded = true;
    moveCompletedUploadsToHistory();
    normalizeRunningUploadsInQueue();
    const viewingHistory = state.uploadView === 'history';
    const history = state.uploadHistory || [];
    const successHistoryKeys = new Set(history.filter(isUploadHistorySuccess).map(uploadHistoryKey));
    const queue = (state.uploadQueue || []).filter((item) => !/\u6210\u529f/.test(item.status || '') && !successHistoryKeys.has(uploadHistoryKey(item)));
    if (queue.length !== (state.uploadQueue || []).length) {
      state.uploadQueue = queue;
      saveUploadQueue();
    }
    const allItems = viewingHistory ? history : queue;
    const pageSize = 10;
    const pageKey = viewingHistory ? 'uploadHistoryPage' : 'uploadPage';
    const totalPages = Math.max(1, Math.ceil(allItems.length / pageSize));
    state[pageKey] = clamp(state[pageKey] || 1, 1, totalPages);
    const pageItems = allItems.slice((state[pageKey] - 1) * pageSize, state[pageKey] * pageSize);
    const currentSku = state.data && state.data.sku ? state.data.sku : '';
    const currentUpload = state.uploadRunning ? getCurrentRunningUpload(queue) : null;
    const statusText = (state.uploadRunning ? '\u8fd0\u884c\u4e2d' : '\u5df2\u6682\u505c') + (currentUpload ? ' | ' + currentUpload.sku : '');
    const visibleIdSet = new Set(allItems.map((item) => item.id));
    const selectedIds = new Set((state.uploadSelectedIds || []).filter((id) => visibleIdSet.has(id)));
    const rows = pageItems.length ? pageItems.map((item) => {
      const active = currentSku && item.sku === currentSku ? ' is-current' : '';
      const isToyLabel = item.kind === 'toy-label';
      const ready = isToyLabel || Boolean(item.xlsxKey && item.zipKey);
      const historyStatus = isToyLabel && (!item.status || item.status === L.uploadSuccess) ? '\u6807\u7b7e\u4e0a\u4f20\u6210\u529f' : (item.status || L.uploadSuccess);
      const status = viewingHistory ? historyStatus : (ready ? (item.status || (isToyLabel ? '\u5f85\u751f\u6210\u73a9\u5177\u6807\u7b7e' : '\u5f85\u4e0a\u4f20')) : '\u7f3a\u6587\u4ef6');
      const statusClass = /\u6210\u529f/.test(status) ? 'is-success' : (!ready || /\u5931\u8d25|\u8df3\u8fc7|\u5df2\u6709\u5185\u5bb9/.test(status) ? 'is-missing' : 'is-ready');
      const files = isToyLabel ? '\u73a9\u5177\u6807\u7b7e\uff1a\u751f\u6210 / \u4e0a\u4f20 BOM / \u4e0b\u8f7d PSD \u4e0e\u56fe\u7247' : [
        item.xlsxName ? 'XLSX \u5df2\u6709 ' + item.xlsxName : 'XLSX \u7f3a\u5c11',
        item.zipName ? 'ZIP \u5df2\u6709 ' + item.zipName : 'ZIP \u7f3a\u5c11',
      ].join(' | ');
      const uploadName = getUploadDisplayName(item);
      const selectAction = viewingHistory ? 'upload-history-select' : 'upload-queue-select';
      const selectHtml = '<button type="button" class="pfh-upload-check' + (selectedIds.has(item.id) ? ' is-checked' : '') + '" data-action="' + selectAction + '" data-upload-id="' + escapeHtml(item.id) + '" title="\u9009\u4e2d"></button>';
      const actionHtml = selectHtml;
      return '<div class="pfh-upload-item' + active + (viewingHistory ? ' is-history' : '') + '" data-upload-id="' + escapeHtml(item.id) + '">' +
        '<div><b>' + escapeHtml(item.sku) + '</b><small>' + escapeHtml(uploadName) + '</small></div>' +
        '<span class="' + statusClass + '">' + escapeHtml(status) + '</span>' +
        '<em title="' + escapeHtml(viewingHistory ? (item.step || item.skipReason || '') : files) + '">' + escapeHtml(viewingHistory ? (item.completedAt || item.updatedAt || '') : (item.step || files)) + '</em>' +
        actionHtml +
        '</div>';
    }).join('') : '<div class="pfh-empty">' + escapeHtml(viewingHistory ? L.uploadHistoryEmpty : L.uploadQueueEmpty) + '</div>';
    const historyHeadActions = '<span class="pfh-upload-head-project"><b>\u9879\u76ee</b></span>';
    const tableHead = '<div class="pfh-upload-table-head' + (viewingHistory ? ' is-history' : '') + '">' + historyHeadActions + '<span>\u72b6\u6001</span><span>' + escapeHtml(viewingHistory ? '\u65f6\u95f4' : '\u6587\u4ef6/\u8fdb\u5ea6') + '</span><span>\u9009\u62e9</span></div>';
    const pagerAction = viewingHistory ? 'upload-history-page' : 'upload-page';
    const pager = '<div class="pfh-upload-pager"><span>\u5171 ' + allItems.length + ' \u6761</span><div><button type="button" data-action="' + pagerAction + '-prev"' + (state[pageKey] <= 1 ? ' disabled' : '') + '>\u2039</button>' + renderCompactPager(pagerAction, state[pageKey], totalPages) + '<button type="button" data-action="' + pagerAction + '-next"' + (state[pageKey] >= totalPages ? ' disabled' : '') + '>\u203a</button></div></div>';
    const selectedActionHtml = '<div class="pfh-upload-bottom-actions"><button type="button" data-action="upload-selected-delete"' + (!selectedIds.size ? ' disabled' : '') + '>' + escapeHtml(L.uploadDelete) + '</button><button type="button" data-action="upload-selected-retry"' + (!selectedIds.size ? ' disabled' : '') + '>' + escapeHtml(L.uploadRetry) + '</button></div>';
    const modeButtonText = viewingHistory ? '\u8fd4\u56de\u961f\u5217' : '\u5386\u53f2\u8bb0\u5f55';
    const uploadModeTabs = !viewingHistory ? '<div class="pfh-upload-mode-tabs' + (state.uploadMode === 'toy-label' ? ' is-toy-label' : '') + '"><i class="pfh-upload-mode-indicator"></i><button type="button" data-action="upload-mode" data-upload-mode="standard" class="' + (state.uploadMode === 'standard' ? 'is-active' : '') + '">\u56fe\u5305\u8868\u683c</button><button type="button" data-action="upload-mode" data-upload-mode="toy-label" class="' + (state.uploadMode === 'toy-label' ? 'is-active' : '') + '">\u73a9\u5177\u6807\u7b7e</button></div>' : '';
    return '<div class="pfh-detail-scroll pfh-upload-scroll"><section class="pfh-section pfh-upload-section is-open' + (viewingHistory ? ' is-history-view' : '') + '">' +
      '<div class="pfh-section-title pfh-upload-title"><h3>' + escapeHtml(L.uploadSection) + '</h3>' +
      '<span class="pfh-upload-status">' + escapeHtml(statusText) + '</span>' +
      '<button type="button" class="pfh-upload-guide-button" data-action="upload-guide" title="\u4f7f\u7528\u8bf4\u660e" aria-label="\u4f7f\u7528\u8bf4\u660e">' + uploadGuideIconHtml() + '</button>' +
      '<button type="button" data-action="upload-history-toggle">' + escapeHtml(modeButtonText) + '</button>' +
      '<button type="button" data-action="upload-clear-list">' + escapeHtml(L.uploadClearList) + '</button>' +
      '<button type="button" data-action="upload-toggle">' + escapeHtml('\u6536\u8d77') + '</button></div>' +
      '<div class="pfh-upload-body">' +
        (viewingHistory ? '' : uploadModeTabs + (state.uploadMode === 'toy-label'
          ? '<textarea class="pfh-toy-label-sku-input" placeholder="\u7c98\u8d34\u591a\u4e2a SKU \u7f16\u7801\uff0c\u6bcf\u884c\u4e00\u4e2a\u6216\u7528\u7a7a\u683c/\u9017\u53f7\u5206\u9694">' + escapeHtml(state.toyLabelSkuInput || '') + '</textarea><div class="pfh-upload-actions"><button type="button" data-action="toy-label-queue-add">\u52a0\u5165\u73a9\u5177\u6807\u7b7e\u4efb\u52a1</button>' + (state.uploadRunning ? '<button type="button" data-action="upload-pause">' + escapeHtml(L.uploadPauseQueue) + '</button>' : '<button type="button" data-action="upload-start">' + escapeHtml(L.uploadStartQueue) + '</button>') + '</div>'
          : '<div class="pfh-upload-drop" data-upload-drop="any">' + escapeHtml(L.uploadDropHint) + '</div>' +
        '<input class="pfh-upload-file" data-upload-kind="any" type="file" multiple accept=".xls,.xlsx,.zip,.rar">' +
        '<div class="pfh-upload-actions"><button type="button" data-action="upload-pick" data-upload-kind="any">\u9009\u62e9\u6587\u4ef6</button>' + (state.uploadRunning ? '<button type="button" data-action="upload-pause">' + escapeHtml(L.uploadPauseQueue) + '</button>' : '<button type="button" data-action="upload-start">' + escapeHtml(L.uploadStartQueue) + '</button>') + '</div>')) +
        tableHead + '<div class="pfh-upload-list">' + rows + '</div>' +
      '</div>' +
      '</section></div>' +
      '<div class="pfh-upload-bottom"><div class="pfh-upload-bottom-line">' + pager + selectedActionHtml + '</div></div>' +
      uploadGuideModalHtml();
  }

  function uploadGuideIconHtml() {
    return '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M512 85.3c235.3 0 426.7 191.4 426.7 426.7 0 235.3-191.4 426.7-426.7 426.7S85.3 747.3 85.3 512C85.3 276.7 276.7 85.3 512 85.3m0-64C241 21.3 21.3 241 21.3 512S241 1002.7 512 1002.7 1002.7 783 1002.7 512 783 21.3 512 21.3z"></path><path d="M512 277.3m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"></path><path d="M512 810.7c-35.3 0-64-28.7-64-64v-256c0-35.3 28.7-64 64-64s64 28.7 64 64v256c0 35.3-28.7 64-64 64z"></path></svg>';
  }

  function uploadGuideModalHtml() {
    if (!state.uploadGuideOpen) return '';
    return '<div class="pfh-upload-guide-modal" data-action="upload-guide-close"><section role="dialog" aria-modal="true" aria-label="\u4f7f\u7528\u8bf4\u660e"><header><h3>\u4f7f\u7528\u8bf4\u660e</h3><button type="button" data-action="upload-guide-close" aria-label="\u5173\u95ed">\u00d7</button></header><article><b>\u56fe\u5305\u8868\u683c</b><p>\u628a XLSX \u548c ZIP \u4e00\u8d77\u62d6\u5165\uff0c\u811a\u672c\u6309\u6587\u4ef6\u540d\u4e2d\u7684 SKU \u81ea\u52a8\u5339\u914d\u5e76\u52a0\u5165\u4efb\u52a1\u680f\u3002</p><b>\u73a9\u5177\u6807\u7b7e</b><p>\u7c98\u8d34\u591a\u4e2a SKU \u540e\u52a0\u5165\u4efb\u52a1\uff1b\u961f\u5217\u4f1a\u9010\u4e2a\u751f\u6210\u6807\u7b7e\u3001\u4e0a\u4f20 BOM\uff0c\u5e76\u5728\u7ed3\u675f\u540e\u4e0b\u8f7d\u4e00\u4e2a ZIP \u538b\u7f29\u5305\u3002</p><p class="pfh-upload-guide-tip">\u8bf7\u5148\u4fdd\u8bc1 SKU \u5df2\u6709\u672c\u5730\u7f13\u5b58\uff0c\u4ee5\u907f\u514d\u4efb\u52a1\u65e0\u6cd5\u83b7\u53d6\u5236\u4f5c\u6570\u636e\u3002</p></article></section></div>';
  }

  function renderCompactPager(actionPrefix, currentPage, totalPages) {
    const pages = buildCompactPages(currentPage, totalPages);
    return pages.map((page) => {
      if (page === '...') return '<span class="pfh-pager-ellipsis">\u2026</span>';
      const active = page === currentPage;
      return active
        ? '<b>' + page + '</b>'
        : '<button type="button" class="pfh-pager-page" data-action="' + actionPrefix + '-goto" data-page="' + page + '">' + page + '</button>';
    }).join('');
  }

  function buildCompactPages(currentPage, totalPages) {
    if (totalPages <= 1) return [1];
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
    const pages = new Set([1, totalPages, currentPage]);
    if (currentPage <= 3) {
      [2, 3, 4].forEach((page) => pages.add(page));
    } else if (currentPage >= totalPages - 2) {
      [totalPages - 3, totalPages - 2, totalPages - 1].forEach((page) => pages.add(page));
    } else {
      [currentPage - 1, currentPage + 1].forEach((page) => pages.add(page));
    }
    const sorted = Array.from(pages).filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
    return sorted.reduce((result, page) => {
      const previous = result[result.length - 1];
      if (typeof previous === 'number' && page - previous > 1) result.push('...');
      result.push(page);
      return result;
    }, []);
  }

  function handlePanelClick(event) {
    const actionTarget = event.target && event.target.closest && event.target.closest('[data-action]');
    const action = actionTarget && actionTarget.getAttribute('data-action');
    if (state.exportMenuOpen && !(event.target && event.target.closest && event.target.closest('.pfh-export-menu'))) {
      state.exportMenuOpen = false;
      renderShell();
      return;
    }
    if (action === 'expand') {
      expandPanel();
      return;
    }
    if (action === 'panel-close') {
      suppressPanelTooltips(actionTarget);
      collapsePanel(true);
      return;
    }
    if (action === 'developer-settings-tap') {
      const now = Date.now();
      if (now - state.developerSettingsTapAt > 1800) state.developerSettingsTapCount = 0;
      state.developerSettingsTapAt = now;
      state.developerSettingsTapCount += 1;
      if (state.developerSettingsTapCount >= 5) {
        state.developerSettingsTapCount = 0;
        state.developerInsightsUnlocked = true;
        state.developerToolsOpen = false;
        renderShell();
        showToast('\u6570\u636e\u6d1e\u5bdf\u5df2\u663e\u793a');
      }
      return;
    }
    if (action === 'developer-tools-close') {
      if (actionTarget.classList.contains('pfh-developer-backdrop') && event.target !== actionTarget) return;
      state.developerToolsOpen = false;
      renderShell();
      return;
    }
    if (action === 'developer-layout-copy') {
      const layout = getCurrentLayoutSnapshot();
      copyText(layout);
      addLog('info', '已复制当前布局', layout.replace(/\n/g, ' | '));
      showToast('当前布局已复制');
      return;
    }
    if (action === 'toggle-collection') {
      state.settings.collectionEnabled = !state.settings.collectionEnabled;
      saveSettings(state.settings);
      if (!state.settings.collectionEnabled) {
        stopScan();
        stopMaterialWatch();
        stopManualTabRead();
      } else {
        state.observedDrawer = getProjectDrawer();
        state.observedSku = state.observedDrawer ? findSku(getVisibleText(state.observedDrawer)) : '';
        state.observedTab = state.observedDrawer ? getActiveTabText(state.observedDrawer) : '';
      }
      showToast(state.settings.collectionEnabled ? '\u6570\u636e\u91c7\u96c6\u5df2\u5f00\u542f' : '\u6570\u636e\u91c7\u96c6\u5df2\u5173\u95ed');
      renderShell();
      return;
    }
    if (action === 'refresh') {
      refreshSelectedData();
      return;
    }
    if (action === 'search') {
      const searchView = state.view === 'sizeImage' ? 'sizeImage' : 'detail';
      state.view = searchView;
      state.copywritingMode = false;
      state.skuPage = 1;
      runSearch(searchView);
      return;
    }
    if (action === 'clear-search') {
      state.skuPage = 1;
      clearSearch();
      return;
    }
    if (action === 'sku-page-prev') {
      state.skuPage = Math.max(1, (state.skuPage || 1) - 1);
      renderShell();
      return;
    }
    if (action === 'sku-page-next') {
      state.skuPage = (state.skuPage || 1) + 1;
      renderShell();
      return;
    }
    if (action === 'sku-page-goto') {
      state.skuPage = Number(actionTarget.getAttribute('data-page')) || state.skuPage || 1;
      renderShell();
      return;
    }
    if (action === 'copy-title-meta') {
      copyText(formatTitleMeta(state.data));
      showToast(L.copied);
      return;
    }
    if (action === 'copy-sku') {
      copyText(state.data && state.data.sku ? state.data.sku : '');
      showToast(L.copied);
      return;
    }
    if (action === 'pin-search-results') {
      pinCurrentSearchResults();
      return;
    }
    if (action === 'about') {
      if (!state.settings.backgroundNoticeSeen) {
        state.settings.backgroundNoticeSeen = true;
        saveSettings(state.settings);
      }
      if (state.view === 'about') {
        state.view = state.settingsReturnView || (state.data ? 'detail' : 'home');
        state.settingsReturnView = '';
      } else {
        state.settingsReturnView = state.view || (state.data ? 'detail' : 'home');
        state.view = 'about';
      }
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'first-run-tutorial-done') {
      const keyInput = ensurePanel().querySelector('.pfh-tutorial-cloud-key');
      if (keyInput) {
        state.settings.cloudBackupKey = keyInput.value.trim();
        saveSettings(state.settings);
      }
      if (!getCloudBackupKey()) {
        showToast(L.cloudBackupMissingKey);
        if (keyInput) keyInput.focus();
        return;
      }
      if (getCloudBackupKey().length < 4) {
        showToast(L.cloudBackupKeyTooShort);
        if (keyInput) keyInput.focus();
        return;
      }
      saveTutorialSeen(true);
      state.tutorialModalOpen = false;
      renderShell();
      return;
    }
    if (action === 'home-main') {
      state.view = 'home';
      state.copywritingMode = false;
      state.uploadExpanded = false;
      state.uploadReturnView = '';
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'open-detail') {
      openSelectedProjectDetail();
      return;
    }
    if (action === 'copywriting-open') {
      openCopywritingFromCurrent(false);
      return;
    }
    if (action === 'copywriting-back') {
      state.copywritingMode = false;
      state.copywritingError = '';
      state.copywritingStatus = '';
      renderShell();
      return;
    }
    if (action === 'copywriting-copy') {
      const record = normalizeCopywritingRecord(state.data && state.data.copywriting);
      if (!record || !record.fullText) showToast('没有可复制的文案');
      else {
        copyText(record.fullText);
        showToast('文案已复制');
      }
      return;
    }
    if (action === 'copywriting-section-copy') {
      const record = normalizeCopywritingRecord(state.data && state.data.copywriting);
      const key = actionTarget.getAttribute('data-copywriting-key') || '';
      const section = record && record.sections ? record.sections.find((item) => item.key === key) : null;
      const value = copywritingSectionCopyValue(section);
      if (!value) showToast('本段没有可复制内容');
      else {
        copyText(value);
        showToast((section && section.label ? section.label : '本段') + '已复制');
      }
      return;
    }
    if (action === 'copywriting-refresh') {
      openCopywritingFromCurrent(true);
      return;
    }
    if (action === 'copywriting-ack') {
      acknowledgeCopywritingUpdate();
      return;
    }
    if (action === 'open-first-detail') {
      openFirstCachedDetail();
      return;
    }
    if (action === 'home-size-image') {
      if (!state.sizeImageAccessEnabled) {
        showToast(state.sizeImageAccessLoading ? '正在核对生成尺寸图权限' : '当前使用人未开通生成尺寸图');
        scheduleSizeImageAccessRefresh(0);
        return;
      }
      state.view = 'sizeImage';
      state.copywritingMode = false;
      state.skuPage = 1;
      if (!state.selectedSku && state.index[0]) state.selectedSku = state.index[0].sku;
      state.data = state.selectedSku ? normalizeData(loadData(state.selectedSku) || { sku: state.selectedSku }) : null;
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'size-image-pick') {
      const input = ensurePanel().querySelector('.pfh-size-image-file-input');
      if (input && !input.disabled) input.click();
      return;
    }
    if (action === 'size-image-save-all') {
      saveCurrentSizeImagesToFolder();
      return;
    }
    if (action === 'excel-prepare') {
      prepareExcelInfo();
      return;
    }
    if (action === 'excel-generate') {
      if (state.exportType === 'toy-label') generateToyLabelFromCurrent();
      else generateExcelFromCurrent();
      return;
    }
    if (action === 'export-menu-toggle') {
      state.exportMenuOpen = !state.exportMenuOpen;
      renderShell();
      return;
    }
    if (action === 'export-type') {
      state.exportType = actionTarget.getAttribute('data-export-type') === 'toy-label' ? 'toy-label' : 'excel';
      state.exportMenuOpen = false;
      renderShell();
      return;
    }
    if (action === 'upload-toggle') {
      if (state.view === 'upload') {
        state.view = state.uploadReturnView || 'home';
        state.uploadReturnView = '';
        state.uploadExpanded = false;
      } else {
        state.uploadReturnView = state.view === 'detail' ? 'detail' : 'home';
        state.view = 'upload';
        state.uploadExpanded = true;
      }
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'home-download-detail') {
      runHomeDetailImageDownload();
      return;
    }
    if (action === 'ledger-open') {
      state.view = 'ledger';
      state.ledgerDate = state.ledgerDate || getTodayKey();
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'ledger-view-design' || action === 'ledger-view-finalized') {
      state.ledgerView = action === 'ledger-view-finalized' ? 'finalized' : 'design';
      state.ledgerTabTransition = state.ledgerView;
      window.clearTimeout(state.ledgerTabTransitionTimer);
      state.ledgerTabTransitionTimer = window.setTimeout(() => {
        state.ledgerTabTransition = '';
        if (state.view === 'ledger') renderShell();
      }, 460);
      renderShell();
      return;
    }
    if (action === 'ledger-prev-day') {
      state.ledgerDate = shiftDateKey(state.ledgerDate, -1);
      renderShell();
      return;
    }
    if (action === 'ledger-prev-month' || action === 'ledger-next-month') {
      state.ledgerDate = shiftLedgerMonth(state.ledgerDate, action === 'ledger-next-month' ? 1 : -1);
      renderShell();
      return;
    }
    if (action === 'ledger-today') {
      state.ledgerDate = getTodayKey();
      renderShell();
      return;
    }
    if (action === 'ledger-copy') {
      copyLedgerTsv(state.ledgerDate);
      return;
    }
    if (action === 'ledger-copy-finalized') {
      copyFinalizedLedgerSkus(state.ledgerDate);
      return;
    }
    if (action === 'ledger-export') {
      exportLedgerRecords(state.ledgerDate);
      return;
    }
    if (action === 'ledger-clear') {
      clearLedgerDate(state.ledgerDate);
      return;
    }
    if (action === 'ledger-more') {
      const sku = actionTarget.getAttribute('data-sku');
      const date = normalizeLedgerDate(actionTarget.getAttribute('data-date')) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
      state.ledgerFlowTransitionSku = '';
      state.ledgerMenuSku = state.ledgerMenuSku === sku ? '' : sku;
      const record = (state.ledgerRecords || []).find((item) => item.sku === sku && item.date === date);
      if (record) refreshLedgerCard(record);
      else renderShell();
      return;
    }
    if (action === 'ledger-image-generated' || action === 'ledger-unmark-image-generated' || action === 'ledger-finalize' || action === 'ledger-unfinalize' || action === 'ledger-void' || action === 'ledger-done' || action === 'ledger-remove') {
      const options = {};
      if (action === 'ledger-finalize') {
        const card = actionTarget.closest('.pfh-ledger-item');
        const input = card && card.querySelector('.pfh-ledger-price input');
        const rawPrice = String(input && input.value || '').trim();
        const purchasePrice = normalizeLedgerPurchasePrice(rawPrice);
        if (rawPrice && !purchasePrice) {
          showToast('价格格式不正确，请输入数字，例如 6 或 6.50');
          if (input) input.focus();
          return;
        }
        if (purchasePrice) options.purchasePrice = purchasePrice;
      }
      updateLedgerFromAction(action, actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'), options);
      return;
    }
    if (action === 'ledger-edit-finalized-time') {
      openLedgerFinalizedTimeEditor(actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'));
      return;
    }
    if (action === 'ledger-time-close') {
      state.ledgerTimeEditor = null;
      renderShell();
      return;
    }
    if (action === 'ledger-time-today' || action === 'ledger-time-yesterday' || action === 'ledger-time-day-before') {
      updateLedgerTimeEditorPreset(action);
      return;
    }
    if (action === 'ledger-time-save') {
      saveLedgerFinalizedTimeEditor();
      return;
    }
    if (action === 'ledger-toggle-box-file' || action === 'ledger-toggle-label-file' || action === 'ledger-toggle-image-pack') {
      toggleLedgerWorkFlag(action, actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'));
      return;
    }
    if (action === 'ledger-open-reference') {
      openLedgerReference(actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'));
      return;
    }
    if (action === 'ledger-open-sku') {
      openLedgerSku(actionTarget.getAttribute('data-sku'));
      return;
    }
    if (action === 'home-excel-coming-soon') {
      showToast('\u656c\u8bf7\u671f\u5f85');
      return;
    }
    if (action === 'home-back') {
      if (state.searchQuery.trim()) {
        state.searchQuery = '';
        state.skuPage = 1;
        const input = ensurePanel().querySelector('.pfh-search-input');
        if (input) input.value = '';
        updateSearchClear();
      }
      const returnView = state.detailReturnView || '';
      state.view = returnView || 'home';
      state.detailReturnView = '';
      state.uploadExpanded = false;
      state.uploadReturnView = '';
      renderShell();
      return;
    }
    if (action === 'upload-history-toggle') {
      state.uploadView = state.uploadView === 'history' ? 'queue' : 'history';
      renderShell();
      return;
    }
    if (action === 'upload-clear-list') {
      clearCurrentUploadList();
      return;
    }
    if (action === 'upload-guide') {
      state.uploadGuideOpen = true;
      renderShell();
      return;
    }
    if (action === 'upload-guide-close') {
      if (actionTarget.classList.contains('pfh-upload-guide-modal') && event.target !== actionTarget) return;
      state.uploadGuideOpen = false;
      renderShell();
      return;
    }
    if (action === 'upload-mode') {
      state.uploadMode = actionTarget.getAttribute('data-upload-mode') === 'toy-label' ? 'toy-label' : 'standard';
      renderShell();
      return;
    }
    if (action === 'toy-label-queue-add') {
      addToyLabelQueueItems(state.toyLabelSkuInput);
      return;
    }
    if (action === 'upload-page-prev') {
      state.uploadPage = Math.max(1, (state.uploadPage || 1) - 1);
      renderShell();
      return;
    }
    if (action === 'upload-page-next') {
      state.uploadPage = (state.uploadPage || 1) + 1;
      renderShell();
      return;
    }
    if (action === 'upload-page-goto') {
      state.uploadPage = Math.max(1, parseInt(actionTarget.getAttribute('data-page') || '1', 10) || 1);
      renderShell();
      return;
    }
    if (action === 'upload-history-page-prev') {
      state.uploadHistoryPage = Math.max(1, (state.uploadHistoryPage || 1) - 1);
      renderShell();
      return;
    }
    if (action === 'upload-history-page-next') {
      state.uploadHistoryPage = (state.uploadHistoryPage || 1) + 1;
      renderShell();
      return;
    }
    if (action === 'upload-history-page-goto') {
      state.uploadHistoryPage = Math.max(1, parseInt(actionTarget.getAttribute('data-page') || '1', 10) || 1);
      renderShell();
      return;
    }
    if (action === 'upload-pick') {
      const input = ensurePanel().querySelector('.pfh-upload-file');
      if (input) input.click();
      return;
    }
    if (action === 'upload-start') {
      startUploadQueue();
      return;
    }
    if (action === 'upload-pause') {
      pauseUploadQueue();
      return;
    }
    if (action === 'upload-remove') {
      removeUploadQueueItem(actionTarget.getAttribute('data-upload-id'));
      return;
    }
    if (action === 'upload-retry') {
      retryUploadQueueItem(actionTarget.getAttribute('data-upload-id'));
      return;
    }
    if (action === 'upload-queue-select') {
      toggleUploadSelection(actionTarget.getAttribute('data-upload-id'));
      return;
    }
    if (action === 'upload-history-select') {
      toggleUploadSelection(actionTarget.getAttribute('data-upload-id'));
      return;
    }
    if (action === 'upload-history-retry') {
      retryUploadHistoryItem(actionTarget.getAttribute('data-upload-id'));
      return;
    }
    if (action === 'upload-history-delete') {
      deleteUploadHistoryItems([actionTarget.getAttribute('data-upload-id')]);
      return;
    }
    if (action === 'upload-selected-retry') {
      retrySelectedUploads();
      return;
    }
    if (action === 'upload-selected-delete') {
      deleteSelectedUploads();
      return;
    }
    if (action === 'export-cache') {
      exportCache();
      return;
    }
    if (action === 'import-cache') {
      const input = ensurePanel().querySelector('.pfh-import-file');
      if (input) input.click();
      return;
    }
    if (action === 'cloud-backup-save') {
      saveCloudBackupNow();
      return;
    }
    if (action === 'cloud-backup-restore') {
      restoreCloudBackup();
      return;
    }
    if (action === 'copy-logs') {
      copyText(formatLogsForCopy());
      showToast(L.copied);
      return;
    }
    if (action === 'clear-logs') {
      state.logs = [];
      saveLogs();
      showToast('\u65e5\u5fd7\u5df2\u6e05\u7a7a');
      renderShell();
      return;
    }
    if (action === 'export-insights') {
      exportInsights();
      return;
    }
    if (action === 'insights-cloud-summary') {
      refreshCloudInsightSummary();
      return;
    }
    if (action === 'insights-readiness') {
      checkCloudInsightReadiness();
      return;
    }
    if (action === 'tips-manage') {
      openLoadingTipsManager();
      return;
    }
    if (action === 'insights-ai-classify') {
      summarizeCloudClassificationRules();
      return;
    }
    if (action === 'insights-apply-classify') {
      applyCloudClassificationRulesToLocal();
      return;
    }
    if (action === 'insights-view-classify') {
      viewCloudClassificationRules();
      return;
    }
    if (action === 'insights-refresh-rules') {
      refreshMaintainedCleaningRules();
      return;
    }
    if (action === 'insights-check-ai') {
      checkCloudInsightAiStatus();
      return;
    }
    if (action === 'insights-check-feishu') {
      checkCloudInsightFeishuStatus();
      return;
    }
    if (action === 'insights-copy-feishu-setup') {
      copyCloudInsightFeishuSetup();
      return;
    }
    if (action === 'insights-sync-feishu') {
      syncCloudInsightToFeishu();
      return;
    }
    if (action === 'insights-copy-report') {
      copyCloudInsightReport();
      return;
    }
    if (action === 'insights-copy-ai') {
      copyCloudInsightAiReport();
      return;
    }
    if (action === 'insights-copy-rules') {
      copyCloudInsightRules();
      return;
    }
    if (action === 'insights-copy-feishu') {
      copyCloudInsightFeishuTable();
      return;
    }
    if (/^insights-rule-/.test(action)) {
      updateMaintainedCleaningRuleStatus(actionTarget.getAttribute('data-rule-id'), action);
      return;
    }
    if (action === 'clear-insights') {
      state.insights = emptyInsights();
      saveInsights();
      showToast('\u6d1e\u5bdf\u6570\u636e\u5df2\u6e05\u7a7a');
      renderShell();
      return;
    }
    if (event.target && event.target.name === 'pfh-keyword-mode') {
      state.settings.excelKeywordMode = event.target.value === 'brandName' ? 'brandName' : 'english';
      saveSettings(state.settings);
      renderShell();
      return;
    }
    if (event.target && event.target.name === 'pfh-download-mode') {
      state.settings.excelDownloadMode = event.target.value === 'direct' ? 'direct' : 'picker';
      saveSettings(state.settings);
      renderShell();
      return;
    }
    if (event.target && event.target.name === 'pfh-ai-model') {
      state.settings.insightAiModel = event.target.value === 'gemini-3.5-flash' ? 'gemini-3.5-flash' : 'glm-4.7-flash';
      saveSettings(state.settings);
      renderShell();
      return;
    }
    if (action === 'confirm-tail-seal') {
      confirmTailSealLength(event.target);
      return;
    }
    if (action === 'copy-all') {
      copyText(formatCopyAll(state.data));
      showToast(L.copied);
      return;
    }

    const pinElement = event.target && event.target.closest && event.target.closest('[data-pin-sku]');
    const pinTarget = pinElement && pinElement.getAttribute('data-pin-sku');
    if (pinTarget) {
      event.stopPropagation();
      togglePin(pinTarget);
      renderShell();
      return;
    }

    const skuButton = event.target && event.target.closest && event.target.closest('[data-sku]');
    if (skuButton) {
      const sku = skuButton.getAttribute('data-sku');
      const data = loadData(sku);
      state.selectedSku = sku;
      state.data = data ? normalizeData(data) : (state.view === 'sizeImage' ? normalizeData({ sku }) : null);
      if (state.view === 'sizeImage') {
        expandPanel();
        renderShell();
        return;
      }
      state.view = 'detail';
      state.copywritingMode = false;
      resetExcelState();
      expandPanel();
      renderShell();
      return;
    }

    const editTarget = event.target && event.target.closest && event.target.closest('[data-edit-key]');
    const editKey = editTarget && editTarget.getAttribute('data-edit-key');
    if (editKey === 'productLength') {
      startTailSealEdit(editTarget);
      return;
    }

    const copyTarget = event.target && event.target.closest && event.target.closest('[data-copy-key]');
    const key = copyTarget && copyTarget.getAttribute('data-copy-key');
    if (key) {
      if (event.target.closest('button, input, textarea, select')) return;
      copyText(key === 'printSizeText' ? formatPrintSizeDisplay(state.data) : ((state.data && state.data[key]) || ''));
      copyTarget.classList.add('is-copied');
      window.setTimeout(() => copyTarget.classList.remove('is-copied'), 650);
      showToast(L.copied);
    }
  }

  function handlePanelKeydown(event) {
    if (event.target && event.target.classList && event.target.classList.contains('pfh-search-input') && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      runSearch();
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-tail-input') && event.key === 'Enter') {
      event.preventDefault();
      confirmTailSealLength(event.target);
    }
  }

  function handlePanelInput(event) {
    if (event.target && event.target.classList && event.target.classList.contains('pfh-size-image-remark-text')) {
      const sku = state.selectedSku || (state.data && state.data.sku) || '';
      const type = event.target.getAttribute('data-size-image-type');
      if (sku && (type === 'carton' || type === 'label')) ensureSizeImageSession(sku)[type + 'RemarkText'] = event.target.value;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-search-input')) {
      event.target.value = normalizeSearchInput(event.target.value);
      updateSearchClear();
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-excel-price')) {
      state.excelPurchasePrice = event.target.value;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-cloud-backup-key')) {
      state.settings.cloudBackupKey = event.target.value.trim();
      saveSettings(state.settings);
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-tutorial-cloud-key')) {
      state.settings.cloudBackupKey = event.target.value.trim();
      saveSettings(state.settings);
      const tutorialButton = ensurePanel().querySelector('[data-action="first-run-tutorial-done"]');
      if (tutorialButton) tutorialButton.disabled = getCloudBackupKey().length < 4;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-toy-label-sku-input')) {
      state.toyLabelSkuInput = event.target.value;
    }
  }

  function handlePanelPaste(event) {
    if (event.defaultPrevented) return;
    if (!(event.target && event.target.classList && event.target.classList.contains('pfh-search-input'))) return;
    const pasted = event.clipboardData && event.clipboardData.getData('text');
    if (!pasted || !/[\r\n,，;；、|/\\]/.test(pasted)) return;
    event.preventDefault();
    const input = event.target;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || start;
    const next = input.value.slice(0, start) + ' ' + pasted + ' ' + input.value.slice(end);
    input.value = normalizeSearchInput(next);
    input.setSelectionRange(input.value.length, input.value.length);
    updateSearchClear();
  }

  function handleSizeImageHoverPaste(event) {
    if (state.view !== 'sizeImage' || state.sizeImageBusySku) return;
    const panel = document.getElementById(PANEL_ID);
    const drop = panel && panel.querySelector('.pfh-size-image-drop:hover');
    if (!drop || drop.disabled) return;
    const clipboard = event.clipboardData;
    const imageFiles = Array.from(clipboard && clipboard.items || [])
      .filter((item) => item.kind === 'file' && /^image\/(?:png|jpeg)$/.test(item.type || ''))
      .map((item) => item.getAsFile())
      .filter(Boolean)
      .map((file, index) => {
        if (/\.(?:png|jpe?g)$/i.test(file.name || '')) return file;
        const extension = file.type === 'image/jpeg' ? 'jpg' : 'png';
        return new File([file], '\u7c98\u8d34\u56fe\u7247-' + (index + 1) + '.' + extension, { type: file.type || 'image/png' });
      });
    if (!imageFiles.length) return;
    event.preventDefault();
    event.stopPropagation();
    drop.classList.add('is-paste-received');
    window.setTimeout(() => drop.classList.remove('is-paste-received'), 360);
    processSizeImageFiles(imageFiles);
  }

  function handlePanelChange(event) {
    if (event.target && event.target.classList && event.target.classList.contains('pfh-size-image-remark-text')) {
      regenerateCurrentSizeImages();
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-size-image-remark-input')) {
      const sku = state.selectedSku || (state.data && state.data.sku) || '';
      if (!sku) return;
      ensureSizeImageSession(sku).includeRemark = Boolean(event.target.checked);
      regenerateCurrentSizeImages();
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-size-image-round-arc-input')) {
      const sku = state.selectedSku || (state.data && state.data.sku) || '';
      if (!sku) return;
      ensureSizeImageSession(sku).includeRoundArc = Boolean(event.target.checked);
      regenerateCurrentSizeImages();
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-size-image-batch-number-input')) {
      const sku = state.selectedSku || (state.data && state.data.sku) || '';
      if (!sku) return;
      ensureSizeImageSession(sku).includeBatchNumber = Boolean(event.target.checked);
      regenerateCurrentSizeImages();
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-size-image-file-input')) {
      const files = Array.from(event.target.files || []);
      event.target.value = '';
      if (files.length) processSizeImageFiles(files);
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-upload-file')) {
      const files = Array.from(event.target.files || []);
      files.forEach((file) => storeQueuedUploadFile(file));
      event.target.value = '';
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-ledger-date')) {
      const month = normalizeLedgerMonth(event.target.value);
      state.ledgerDate = month + '-01';
      renderShell();
    }
  }

  function handlePanelDragOver(event) {
    if (event.target && event.target.closest && event.target.closest('.pfh-size-image-page')) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
      return;
    }
    if (event.target && event.target.closest && event.target.closest('.pfh-upload-section')) {
      event.preventDefault();
    }
  }

  function handlePanelDrop(event) {
    if (event.target && event.target.closest && event.target.closest('.pfh-size-image-page')) {
      event.preventDefault();
      const files = Array.from(event.dataTransfer && event.dataTransfer.files || []);
      if (files.length) processSizeImageFiles(files);
      return;
    }
    if (!(event.target && event.target.closest && event.target.closest('.pfh-upload-section'))) return;
    event.preventDefault();
    const files = Array.from(event.dataTransfer && event.dataTransfer.files || []);
    files.forEach((file) => storeQueuedUploadFile(file));
  }

  function startTailSealEdit(target) {
    const row = target && target.closest && target.closest('[data-key="productLength"]');
    if (!row) return;
    const valueBox = row.querySelector('.pfh-value');
    if (!valueBox) return;
    const current = firstNumber(state.data && state.data.productLength);
    valueBox.innerHTML = '<span class="pfh-inline-edit"><input class="pfh-tail-input" type="text" placeholder="cm" value="' +
      escapeHtml(Number.isFinite(current) ? trimNumber(current) : '') +
      '"><button type="button" data-action="confirm-tail-seal">' + escapeHtml(L.ok) + '</button></span>';
    const input = valueBox.querySelector('input');
    if (input) input.focus();
  }

  function confirmTailSealLength(target) {
    const row = target && target.closest && target.closest('[data-key="productLength"]');
    const input = row && row.querySelector('.pfh-tail-input');
    const cm = firstNumber(input && input.value);
    if (!Number.isFinite(cm) || cm <= 0) {
      showToast(L.invalidCm);
      return;
    }
    const value = formatDimensionPart([cm], 0);
    state.data = normalizeData({ ...(state.data || {}), tailSealLengthValue: value, productLength: value });
    if (state.data.sku) saveData(state.data.sku, state.data);
    renderShell();
  }

  async function storeQueuedUploadFile(file) {
    if (!file) return;
    const kind = getUploadKindFromFileName(file.name);
    if (!kind) return;
    const skus = getSkusFromFileName(file.name);
    if (!skus.length) {
      showToast(L.uploadNoSkuInFile + ': ' + file.name);
      return;
    }
    if (kind === 'zip' && file.size > UPLOAD_MAX_ZIP_BYTES) {
      const skippedItems = [];
      for (const sku of skus) {
        const item = ensureUploadQueueItem(sku, file.name);
        if (item.zipKey) deleteUploadFile(item.zipKey).catch((error) => console.warn('PLM floating helper upload file cleanup failed:', error));
        item.zipName = file.name;
        item.zipKey = '';
        item.status = '\u5df2\u8df3\u8fc7';
        item.step = L.uploadFileTooLarge;
        item.skipReason = L.uploadFileTooLarge;
        item.updatedAt = new Date().toLocaleString();
        skippedItems.push(item);
      }
      saveUploadQueue();
      state.uploadExpanded = true;
      state.view = 'upload';
      renderShell();
      showToast(skus.join(' / ') + ' ' + L.uploadFileTooLarge);
      return;
    }
    try {
      for (const sku of skus) {
        const key = uploadFileKey(sku, kind);
        await putUploadFile(key, cloneUploadFile(file));
        const item = ensureUploadQueueItem(sku, file.name);
        if (kind === 'xlsx') {
          item.xlsxName = file.name;
          item.xlsxKey = key;
        } else {
          item.zipName = file.name;
          item.zipKey = key;
        }
        item.status = item.xlsxKey && item.zipKey ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6';
        item.step = item.xlsxKey && item.zipKey ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item);
        item.forceReplace = false;
        item.skipReason = '';
        item.updatedAt = new Date().toLocaleString();
      }
      saveUploadQueue();
      state.uploadExpanded = true;
      state.view = 'upload';
      renderShell();
      showToast(skus.join(' / ') + ' ' + kind.toUpperCase() + ' \u5df2\u52a0\u5165');
    } catch (error) {
      console.warn('PLM floating helper store upload file failed:', error);
      showToast('\u6587\u4ef6\u8bb0\u5f55\u5931\u8d25');
    }
  }

  function ensureUploadQueueItem(sku, filename) {
    let item = state.uploadQueue.find((entry) => entry.sku === sku && !/成功/.test(entry.status || ''));
    if (item) return item;
    const cached = loadData(sku);
    item = {
      id: sku + '-' + Date.now(),
      sku,
      name: buildUploadDisplayName(cached, filename, sku),
      status: '\u7f3a\u6587\u4ef6',
      step: '',
      forceReplace: false,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
    };
    state.uploadQueue.unshift(item);
    return item;
  }

  function addToyLabelQueueItems(input) {
    const skus = Array.from(new Set((String(input || '').match(/\bSKU\d+\b/ig) || []).map((sku) => sku.toUpperCase())));
    if (!skus.length) {
      showToast('请粘贴至少一个 SKU 编码');
      return;
    }
    const queued = new Set((state.uploadQueue || []).filter((item) => item.kind === 'toy-label' && !/\u6210\u529f/.test(item.status || '')).map((item) => item.sku));
    const now = new Date().toLocaleString();
    const items = skus.filter((sku) => !queued.has(sku)).map((sku, index) => {
      const cached = loadData(sku);
      return {
        id: 'toy-label-' + sku + '-' + Date.now() + '-' + index,
        kind: 'toy-label',
        sku,
        name: buildUploadDisplayName(cached, '', sku),
        xlsxKey: 'toy-label',
        zipKey: 'toy-label',
        status: '\u5f85\u751f\u6210\u73a9\u5177\u6807\u7b7e',
        step: cached ? '\u7b49\u5f85\u6279\u91cf\u641c\u7d22' : '\u7b49\u5f85\u4ece\u8bbe\u8ba1\u4efb\u52a1\u83b7\u53d6\u6570\u636e',
        createdAt: now,
        updatedAt: now,
      };
    });
    if (!items.length) {
      showToast('这些 SKU 已在玩具标签任务栏中');
      return;
    }
    state.uploadQueue = items.concat(state.uploadQueue || []);
    state.toyLabelSkuInput = '';
    state.uploadPage = 1;
    saveUploadQueue();
    renderShell();
    showToast(items.length + ' 个玩具标签任务已加入');
  }

  function cloneUploadFile(file) {
    return new File([file], file.name, { type: file.type || guessMime(file.name), lastModified: file.lastModified || Date.now() });
  }

  function getSkuFromFileName(filename) {
    const skus = getSkusFromFileName(filename);
    return skus[0] || '';
  }

  function getSkusFromFileName(filename) {
    const matches = String(filename || '').match(/\bSKU\d+\b/ig) || [];
    return matches.map((sku) => sku.toUpperCase()).filter((sku, index, arr) => arr.indexOf(sku) === index);
  }

  function getUploadKindFromFileName(filename) {
    const lower = String(filename || '').toLowerCase();
    if (/\.(xlsx|xls)$/.test(lower)) return 'xlsx';
    if (/\.(zip|rar)$/.test(lower)) return 'zip';
    return '';
  }

  function inferUploadNameFromFileName(filename, sku) {
    return compactText(String(filename || '').replace(/\.[^.]+$/, '').replace(sku, ''));
  }

  function buildUploadDisplayName(cached, filename, sku) {
    const fromCache = [cached && cached.brand, cached && cached.name].filter(Boolean).join(' ');
    return cleanName(fromCache) || cleanName(inferUploadNameFromFileName(filename, sku));
  }

  function getUploadDisplayName(item) {
    const cached = item && item.sku ? loadData(item.sku) : null;
    const filename = (item && (item.xlsxName || item.zipName)) || '';
    const name = buildUploadDisplayName(cached, filename, item && item.sku);
    if (name && item && item.name !== name) {
      item.name = name;
      window.setTimeout(() => {
        const queue = loadUploadQueue();
        const target = queue.find((entry) => entry.id === item.id);
        if (!target || target.name === name) return;
        target.name = name;
        state.uploadQueue = queue.map((entry) => entry.id === item.id ? target : entry);
        saveUploadQueue();
      }, 0);
    }
    return name || (item && item.name) || '';
  }

  function getMissingUploadText(item) {
    const missing = [];
    if (!item.xlsxKey) missing.push('XLSX');
    if (!item.zipKey) missing.push('ZIP');
    return '\u7f3a ' + missing.join(' + ');
  }

  function removeUploadQueueItem(id) {
    const target = state.uploadQueue.find((item) => item.id === id);
    cleanupUploadFiles(target);
    state.uploadQueue = state.uploadQueue.filter((item) => item.id !== id);
    saveUploadQueue();
    renderShell();
  }

  function retryUploadQueueItem(id) {
    const latestQueue = loadUploadQueue();
    let found = false;
    state.uploadQueue = latestQueue.map((item) => {
      if (item.id !== id) return item;
      found = true;
      const ready = Boolean(item.xlsxKey && item.zipKey);
      const hadExistingContent = /\u5df2\u6709\u5185\u5bb9/.test(item.status || '');
      return {
        ...item,
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item),
        skipReason: '',
        forceReplace: hadExistingContent,
        updatedAt: new Date().toLocaleString(),
      };
    });
    if (!found) return;
    saveUploadQueue();
    showToast(L.uploadRetry + '\uff1a\u5df2\u91cd\u65b0\u52a0\u5165\u961f\u5217');
    startUploadQueue();
  }

  function toggleUploadSelection(id) {
    if (!id) return;
    const selected = new Set(state.uploadSelectedIds || []);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    state.uploadSelectedIds = Array.from(selected);
    renderShell();
  }

  function retryUploadHistoryItem(id) {
    retryUploadHistoryItems([id]);
  }

  function retrySelectedUploads() {
    if (state.uploadView === 'history') retryUploadHistoryItems(state.uploadSelectedIds || []);
    else retryUploadQueueItems(state.uploadSelectedIds || []);
  }

  function deleteSelectedUploads() {
    if (state.uploadView === 'history') deleteUploadHistoryItems(state.uploadSelectedIds || []);
    else deleteUploadQueueItems(state.uploadSelectedIds || []);
  }

  function retryUploadQueueItems(ids) {
    const idSet = new Set((ids || []).filter(Boolean));
    if (!idSet.size) return;
    const now = new Date().toLocaleString();
    let changed = false;
    state.uploadQueue = loadUploadQueue().map((item) => {
      if (!idSet.has(item.id)) return item;
      changed = true;
      const ready = Boolean(item.xlsxKey && item.zipKey);
      const hadExistingContent = /\u5df2\u6709\u5185\u5bb9/.test(item.status || '');
      return {
        ...item,
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item),
        skipReason: '',
        forceReplace: hadExistingContent,
        updatedAt: now,
      };
    });
    if (!changed) return;
    state.uploadSelectedIds = (state.uploadSelectedIds || []).filter((id) => !idSet.has(id));
    saveUploadQueue();
    renderShell();
    showToast('\u5df2\u91cd\u65b0\u52a0\u5165\u961f\u5217');
    startUploadQueue();
  }

  function deleteUploadQueueItems(ids) {
    const idSet = new Set((ids || []).filter(Boolean));
    if (!idSet.size) return;
    const removed = [];
    state.uploadQueue = loadUploadQueue().filter((item) => {
      if (!idSet.has(item.id)) return true;
      removed.push(item);
      return false;
    });
    removed.forEach(cleanupUploadFiles);
    state.uploadSelectedIds = (state.uploadSelectedIds || []).filter((id) => !idSet.has(id));
    saveUploadQueue();
    renderShell();
    showToast('\u5df2\u5220\u9664\u961f\u5217\u8bb0\u5f55');
  }

  function retryUploadHistoryItems(ids) {
    const idSet = new Set((ids || []).filter(Boolean));
    if (!idSet.size) return;
    const history = loadUploadHistory();
    const targets = history.filter((item) => idSet.has(item.id));
    if (!targets.length) return;
    const queue = loadUploadQueue();
    const now = new Date().toLocaleString();
    targets.forEach((item) => {
      const ready = Boolean(item.xlsxKey && item.zipKey);
      queue.unshift({
        ...item,
        id: item.sku + '-retry-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item),
        skipReason: '',
        forceReplace: true,
        completedAt: '',
        updatedAt: now,
        createdAt: now,
      });
    });
    const targetKeys = new Set(targets.map(uploadHistoryKey));
    state.uploadQueue = queue;
    state.uploadHistory = history.filter((item) => !idSet.has(item.id) && !targetKeys.has(uploadHistoryKey(item)));
    state.uploadSelectedIds = (state.uploadSelectedIds || []).filter((id) => !idSet.has(id));
    saveUploadQueue();
    saveUploadHistory();
    state.uploadView = 'queue';
    renderShell();
    showToast('\u5df2\u6062\u590d\u5230\u961f\u5217' + (targets.some((item) => !(item.xlsxKey && item.zipKey)) ? '\uff0c\u8bf7\u8865\u5145\u6587\u4ef6' : ''));
  }

  function deleteUploadHistoryItems(ids) {
    const idSet = new Set((ids || []).filter(Boolean));
    if (!idSet.size) return;
    state.uploadHistory = loadUploadHistory().filter((item) => !idSet.has(item.id));
    state.uploadSelectedIds = (state.uploadSelectedIds || []).filter((id) => !idSet.has(id));
    saveUploadHistory();
    renderShell();
    showToast('\u5df2\u5220\u9664\u5386\u53f2\u8bb0\u5f55');
  }

  function startUploadQueue() {
    state.uploadRunning = true;
    saveUploadWorkerRunning(true);
    saveUploadQueue();
    state.uploadExpanded = true;
    renderShell();
    showToast(L.uploadQueueStarted);
    const workerUrl = location.origin + '/productManagementProduct?plmUploadWorker=1';
    if (!isUploadWorkerPage()) window.open(workerUrl, 'plm-upload-worker');
    else window.setTimeout(() => processUploadQueue(), 800);
  }

  function pauseUploadQueue() {
    state.uploadRunning = false;
    saveUploadWorkerRunning(false);
    resetRunningUploadsToPending();
    saveUploadQueue();
    renderShell();
    showToast(L.uploadQueuePaused);
  }

  async function finishUploadQueue() {
    await closeCancelConfigModalIfPresent();
    state.uploadRunning = false;
    saveUploadWorkerRunning(false);
    moveCompletedUploadsToHistory();
    state.uploadQueue = loadUploadQueue();
    const toyLabelManifest = loadToyLabelExportManifest();
    if (toyLabelManifest.downloaded) await clearToyLabelExportManifest(toyLabelManifest);
    else await downloadToyLabelBatchArchive();
    renderShell();
    showToast(L.uploadQueuePaused);
  }

  function clearCurrentUploadList() {
    if (!window.confirm(L.uploadClearConfirm)) return;
    if (state.uploadView === 'history') {
      state.uploadHistory = [];
      state.uploadHistoryPage = 1;
      state.uploadSelectedIds = [];
      saveUploadHistory();
      renderShell();
      showToast('\u5386\u53f2\u8bb0\u5f55\u5df2\u6e05\u7a7a');
      return;
    }
    const queue = loadUploadQueue();
    queue.forEach(cleanupUploadFiles);
    state.uploadQueue = [];
    state.uploadPage = 1;
    state.uploadSelectedIds = [];
    state.uploadRunning = false;
    saveUploadWorkerRunning(false);
    saveUploadQueue();
    renderShell();
    showToast('\u961f\u5217\u5df2\u6e05\u7a7a');
  }

  function resetRunningUploadsToPending() {
    const queue = loadUploadQueue();
    state.uploadQueue = queue.map((item) => {
      if (!/\u8fdb\u884c\u4e2d/.test(item.status || '')) return item;
      const ready = Boolean(item.xlsxKey && item.zipKey);
      return {
        ...item,
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item),
        updatedAt: new Date().toLocaleString(),
      };
    });
  }

  function updateUploadItem(item, status, step, extra) {
    const latestQueue = loadUploadQueue();
    const latestItem = latestQueue.find((entry) => entry.id === item.id) || item;
    if (extra && typeof extra === 'object') Object.assign(latestItem, extra);
    latestItem.status = status || latestItem.status;
    latestItem.step = step || '';
    latestItem.updatedAt = new Date().toLocaleString();
    Object.assign(item, latestItem);
    const cleanedQueue = /\u8fdb\u884c\u4e2d/.test(latestItem.status || '')
      ? archiveOtherRunningUploads(latestQueue, latestItem)
      : latestQueue;
    state.uploadQueue = cleanedQueue.some((entry) => entry.id === item.id)
      ? cleanedQueue.map((entry) => entry.id === item.id ? latestItem : entry)
      : [latestItem].concat(cleanedQueue);
    saveUploadQueue();
    renderShell();
  }

  function getCurrentRunningUpload(queue) {
    return (queue || [])
      .filter((item) => /\u8fdb\u884c\u4e2d/.test(item.status || ''))
      .sort((a, b) => getUploadTimeMs(b) - getUploadTimeMs(a))[0] || null;
  }

  function getUploadTimeMs(item) {
    const value = item && (item.updatedAt || item.createdAt || item.completedAt);
    const ms = Date.parse(value || '');
    return Number.isFinite(ms) ? ms : 0;
  }

  function archiveOtherRunningUploads(queue, activeItem) {
    const stale = (queue || []).filter((entry) => entry.id !== activeItem.id && /\u8fdb\u884c\u4e2d/.test(entry.status || ''));
    if (!stale.length) return queue;
    const now = new Date().toLocaleString();
    return (queue || []).map((entry) => {
      if (!stale.some((item) => item.id === entry.id)) return entry;
      if (entry.kind === 'toy-label') {
        return {
          ...entry,
          status: '\u5f85\u751f\u6210\u73a9\u5177\u6807\u7b7e',
          step: '\u7b49\u5f85\u5904\u7406',
          updatedAt: now,
        };
      }
      const ready = Boolean(entry.xlsxKey && entry.zipKey);
      return {
        ...entry,
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(entry),
        updatedAt: now,
      };
    });
  }

  function normalizeRunningUploadsInQueue() {
    const queue = loadUploadQueue();
    const running = queue.filter((entry) => /\u8fdb\u884c\u4e2d/.test(entry.status || ''));
    if (running.length <= 1) return;
    const active = getCurrentRunningUpload(running);
    state.uploadQueue = archiveOtherRunningUploads(queue, active);
    saveUploadQueue();
  }

  async function prepareToyLabelBatchQueue(queue) {
    const items = (queue || []).filter((entry) => entry.kind === 'toy-label' && entry.xlsxKey && entry.zipKey && !/成功|进行中|已跳过|已有内容|失败/.test(entry.status || ''));
    if (!items.length) return true;
    const skus = Array.from(new Set(items.map((item) => String(item.sku || '').toUpperCase()).filter(Boolean)));
    const signature = skus.join('|');
    await ensureToyLabelExportRun(signature);
    const prepared = state.toyLabelBatchRows || {};
    if (state.toyLabelBatchPreparedSignature === signature && skus.every((sku) => prepared[sku])) return true;
    if (!(await ensureNewProductProjectPage()) || !(await ensureDesignTaskTab())) {
      addLog('error', '玩具标签：无法进入设计任务批量搜索', skus.join(' '));
      return false;
    }
    const input = findInputByPlaceholder('\u641c\u7d22\u5546\u54c1\u7f16\u7801');
    const button = findButtonByText('\u67e5\u8be2');
    if (!input || !button) {
      addLog('error', '玩具标签：未找到商品编码批量搜索框', '');
      return false;
    }
    addLog('info', '玩具标签：批量搜索设计任务', skus.length + '个编码');
    setNativeInputValue(input, skus.join(' '));
    clickElement(button);
    await wait(450);
    await waitFor(() => collectToyLabelBatchRows(skus).length > 0 || (!isProjectResultLoading() && hasProjectResultEmptyState()), 12000, 180);
    await expandProjectResultPageSize(skus.length);
    await wait(350);
    const rows = collectToyLabelBatchRows(skus);
    const rowMap = {};
    rows.forEach((row) => {
      rowMap[row.sku] = row;
      const previous = normalizeData(loadData(row.sku) || { sku: row.sku });
      const imageUrl = stripOssResizeParams(row.productImageUrl || '');
      const next = normalizeData({
        ...previous,
        sku: row.sku,
        brand: row.brand || previous.brand || '',
        name: row.name || previous.name || '',
        projectRowId: row.rowId || previous.projectRowId || '',
        toyLabelProductImageUrl: imageUrl || row.productImageUrl || '',
        toyLabelProductImageFallbackUrl: row.productImageUrl || imageUrl || '',
        updatedAt: previous.updatedAt || new Date().toLocaleString(),
        updatedAtMs: previous.updatedAtMs || Date.now(),
      });
      saveDataDirect(row.sku, next);
      upsertIndex(next);
    });
    state.toyLabelBatchRows = rowMap;
    state.toyLabelBatchPreparedSignature = signature;
    state.uploadQueue = loadUploadQueue().map((entry) => {
      if (entry.kind !== 'toy-label' || !rowMap[entry.sku]) return entry;
      const cached = loadData(entry.sku);
      return {
        ...entry,
        name: buildUploadDisplayName(cached, '', entry.sku),
        step: '\u5df2\u83b7\u53d6\u5546\u54c1\u56fe\u7247\uff0c\u7b49\u5f85\u4e0a\u4f20 BOM',
        updatedAt: new Date().toLocaleString(),
      };
    });
    saveUploadQueue();
    queueCloudBackup();
    const missing = skus.filter((sku) => !rowMap[sku]);
    await prepareAndDownloadToyLabelBatch(items.filter((item) => rowMap[item.sku]), signature);
    addLog(missing.length ? 'warn' : 'success', '玩具标签：设计任务批量数据已读取', rows.length + '/' + skus.length + (missing.length ? '，未找到 ' + missing.join(' ') : ''));
    renderShell();
    return rows.length > 0;
  }

  async function prepareAndDownloadToyLabelBatch(items, signature) {
    let manifest = loadToyLabelExportManifest();
    for (const item of items || []) {
      const sku = String(item && item.sku || '').toUpperCase();
      if (!sku || manifest.files.filter((entry) => entry.sku === sku).length >= 3) continue;
      const data = normalizeData(loadData(sku) || {});
      if (!data.sku) continue;
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u751f\u6210\u6807\u7b7e\u6253\u5305\u6587\u4ef6');
      state.selectedSku = data.sku;
      state.sku = data.sku;
      state.data = data;
      state.view = 'detail';
      resetExcelState();
      const generated = await generateToyLabelFromCurrent({
        collectFiles: state.toyLabelBatchFiles,
        batchSignature: signature,
        skipExcelPrepare: true,
        skipBomUpload: true,
        batchRowOnly: true,
      });
      if (!generated) markUploadQueueBlocked(item, L.uploadFailed, '\u73a9\u5177\u6807\u7b7e\u6587\u4ef6\u751f\u6210\u5931\u8d25');
      else updateUploadItem(item, '\u5f85\u4e0a\u4f20', '\u5df2\u6253\u5305\uff0c\u7b49\u5f85\u4e0a\u4f20 BOM');
      manifest = loadToyLabelExportManifest();
    }
    if (!manifest.files.length || manifest.downloaded) return;
    addLog('info', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e\uff1a\u56fe\u7247\u5df2\u83b7\u53d6\uff0c\u5148\u4e0b\u8f7d ZIP', manifest.files.length + '\u4e2a\u6587\u4ef6');
    await downloadToyLabelBatchArchive({ keepStagedFiles: true });
  }

  function collectToyLabelBatchRows(requestedSkus) {
    const requested = new Set((requestedSkus || []).map((sku) => String(sku || '').toUpperCase()));
    const header = Array.from(document.querySelectorAll('table.vxe-table--header'))
      .map((table) => Array.from(table.querySelectorAll('thead th')))
      .find((cells) => cells.some((cell) => compactText(cell.innerText || cell.textContent).replace(/^\*/, '') === '\u5546\u54c1\u56fe\u7247')) || [];
    const headerNames = header.map((cell) => compactText(cell.innerText || cell.textContent).replace(/^\*/, ''));
    const skuIndex = headerNames.indexOf('\u5546\u54c1\u7f16\u7801');
    const brandIndex = headerNames.indexOf('\u54c1\u724c');
    const nameIndex = headerNames.indexOf('\u5546\u54c1\u540d\u79f0');
    const imageIndex = headerNames.indexOf('\u5546\u54c1\u56fe\u7247');
    if (skuIndex < 0 || imageIndex < 0) return [];
    const body = Array.from(document.querySelectorAll('table.vxe-table--body'))
      .find((table) => Array.from(table.querySelectorAll('tbody tr')).some((row) => row.children.length > imageIndex && /SKU\d+/i.test(row.innerText || row.textContent || '')));
    if (!body) return [];
    return Array.from(body.querySelectorAll('tbody tr')).map((row) => {
      const cells = Array.from(row.children);
      const skuText = cells[skuIndex] ? compactText(cells[skuIndex].innerText || cells[skuIndex].textContent) : '';
      const sku = ((skuText.match(/SKU\d+/i) || [])[0] || '').toUpperCase();
      const image = cells[imageIndex] && cells[imageIndex].querySelector('img');
      return {
        sku,
        rowId: row.getAttribute('rowid') || '',
        brand: brandIndex >= 0 && cells[brandIndex] ? compactText(cells[brandIndex].innerText || cells[brandIndex].textContent) : '',
        name: nameIndex >= 0 && cells[nameIndex] ? compactText(cells[nameIndex].innerText || cells[nameIndex].textContent) : '',
        productImageUrl: image ? (image.currentSrc || image.src || image.getAttribute('src') || '') : '',
      };
    }).filter((row) => row.sku && requested.has(row.sku) && row.rowId && row.productImageUrl);
  }

  function isProjectResultLoading() {
    return Array.from(document.querySelectorAll('.vxe-loading--wrapper, .ant-spin-spinning, .vxe-table--loading')).some(isVisibleElement);
  }

  function hasProjectResultEmptyState() {
    return Array.from(document.querySelectorAll('.vxe-table--empty-content, .vxe-table--empty-block, .ant-empty'))
      .filter(isVisibleElement)
      .some((el) => /\u6682\u65e0\u6570\u636e|\u6682\u65e0|No Data/i.test(compactText(el.innerText || el.textContent)));
  }

  async function expandProjectResultPageSize(minimum) {
    if (Number(minimum) <= 20) return;
    const selector = Array.from(document.querySelectorAll('.ant-select-selector'))
      .filter(isVisibleElement)
      .find((el) => /\d+\s*\u6761\s*\/\s*\u9875/.test(compactText(el.innerText || el.textContent)));
    if (!selector) return;
    const current = Number((compactText(selector.innerText || selector.textContent).match(/\d+/) || [])[0]) || 20;
    if (current >= minimum) return;
    clickElement(selector);
    let options = [];
    try {
      options = await waitUntil(() => {
        const found = Array.from(document.querySelectorAll('.ant-select-item-option, [role="option"]'))
          .filter(isVisibleElement)
          .map((el) => ({ el, size: Number((compactText(el.innerText || el.textContent).match(/\d+/) || [])[0]) || 0 }))
          .filter((item) => item.size > current);
        return found.length ? found : null;
      }, 2500, 100);
    } catch (error) {
      return;
    }
    if (!options.length) return;
    options.sort((a, b) => a.size - b.size);
    const target = options.find((item) => item.size >= minimum) || options[options.length - 1];
    clickElement(target.el);
    await waitFor(() => !isProjectResultLoading(), 8000, 180);
  }

  async function processUploadQueue() {
    state.uploadRunning = loadUploadWorkerRunning();
    state.uploadQueue = loadUploadQueue();
    if (!state.uploadRunning || state.uploadProcessing) return;
    state.uploadProcessing = true;
    try {
      await prepareToyLabelBatchQueue(state.uploadQueue);
      while (state.uploadRunning) {
        if (await recoverPurchaseEmptyRunningUpload()) {
          state.uploadRunning = loadUploadWorkerRunning();
          state.uploadQueue = loadUploadQueue();
          continue;
        }
        const pendingItems = state.uploadQueue.filter((entry) => entry.xlsxKey && entry.zipKey && !/成功|进行中|已跳过|已有内容|失败/.test(entry.status || ''));
        const item = pendingItems.find((entry) => entry.kind === 'toy-label') || pendingItems[0];
        if (!item) {
          await finishUploadQueue();
          break;
        }
        await ensureUploadPageReadyForNextItem();
        try {
          await runUploadQueueItem(item);
        } catch (error) {
          if (await recoverPurchaseEmptyRunningUpload()) {
            state.uploadRunning = loadUploadWorkerRunning();
            state.uploadQueue = loadUploadQueue();
            continue;
          }
          const message = error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef';
          console.warn('PLM floating helper upload queue item failed, continue next:', error);
          markUploadQueueBlocked(item, L.uploadFailed, message);
          await closeTopProductDrawer({ skipDraftSave: true }).catch((closeError) => {
            console.warn('PLM floating helper close failed after item error:', closeError);
          });
        }
        state.uploadRunning = loadUploadWorkerRunning();
        state.uploadQueue = loadUploadQueue();
      }
    } finally {
      await closeCancelConfigModalIfPresent().catch((error) => console.warn('PLM floating helper final modal cleanup failed:', error));
      state.uploadProcessing = false;
      if (loadUploadWorkerRunning()) {
        window.setTimeout(() => processUploadQueue(), 800);
      }
    }
  }

  async function runToyLabelQueueItem(item) {
    const data = normalizeData(loadData(item && item.sku) || {});
    if (!data.sku) {
      markUploadQueueBlocked(item, L.uploadFailed, '\u8bbe\u8ba1\u4efb\u52a1\u6279\u91cf\u641c\u7d22\u4e2d\u672a\u627e\u5230\u8be5 SKU');
      return;
    }
    if (!data.projectRowId || !(data.toyLabelProductImageUrl || data.toyLabelProductImageFallbackUrl || data.productListImageUrl || data.productListImageFallbackUrl || getProductThumbUrl(data))) {
      markUploadQueueBlocked(item, L.uploadFailed, '\u8bbe\u8ba1\u4efb\u52a1\u641c\u7d22\u7ed3\u679c\u4e2d\u672a\u627e\u5230\u5546\u54c1\u56fe\u7247\u6216\u884c\u6807\u8bc6');
      return;
    }
    updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4f7f\u7528\u8bbe\u8ba1\u4efb\u52a1\u5546\u54c1\u56fe\u7247');
    state.selectedSku = data.sku;
    state.sku = data.sku;
    state.data = data;
    state.view = 'detail';
    resetExcelState();
    updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4e0a\u4f20\u5df2\u6253\u5305\u7684\u6807\u7b7e\u5230 BOM');
    const stagedPreview = await getStagedToyLabelPreview(data.sku);
    let completed = false;
    if (stagedPreview) {
      try {
        await uploadToyLabelPreviewToBom(data, stagedPreview.blob, stagedPreview.filename, { batchRowOnly: true });
        completed = true;
      } catch (error) {
        console.warn('PLM floating helper staged toy label upload failed:', error);
      }
    } else {
      completed = await generateToyLabelFromCurrent({ collectFiles: state.toyLabelBatchFiles, batchSignature: state.toyLabelBatchPreparedSignature, skipExcelPrepare: true, batchRowOnly: true });
    }
    if (!completed) {
      markUploadQueueBlocked(item, L.uploadFailed, '\u73a9\u5177\u6807\u7b7e\u751f\u6210\u6216 BOM \u4e0a\u4f20\u5931\u8d25');
      return;
    }
    archiveUploadItem(item);
    addLog('success', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e\u5b8c\u6210', data.sku);
  }

  async function getStagedToyLabelPreview(sku) {
    const manifest = loadToyLabelExportManifest();
    const entry = manifest.files.find((file) => file.sku === String(sku || '').toUpperCase() && /\.jpg$/i.test(file.filename) && !/\u5370\u5237/.test(file.filename));
    if (!entry) return null;
    const blob = await getUploadFile(entry.key).catch(() => null);
    return blob ? { filename: entry.filename, blob } : null;
  }

  async function runUploadQueueItem(item) {
    if (item && item.kind === 'toy-label') {
      await runToyLabelQueueItem(item);
      return;
    }
    addLog('info', '\u63d0\u5ba1\u4e0a\u4f20\u5f00\u59cb', item && item.sku ? item.sku : '');
    const xlsx = await getUploadFile(item.xlsxKey);
    const zip = await getUploadFile(item.zipKey);
    if (!xlsx || !zip) {
      markUploadQueueBlocked(item, L.uploadFailed, '\u7f3a\u5c11\u6587\u4ef6');
      addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u7f3a\u5c11\u6587\u4ef6', item && item.sku ? item.sku : '');
      return;
    }
    try {
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6253\u5f00\u5546\u54c1');
      await ensureProductManagementPage();
      await searchProductManagementSku(item.sku);
      await openProductEditDrawer(item.sku);
      await enterProductEditSecondStep(item.sku);
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u68c0\u67e5\u65e7\u5185\u5bb9');
      const existingSummary = getProductReplaceUploadSummary(item.sku);
      if (existingSummary.total && !item.forceReplace) {
        markUploadQueueBlocked(item, L.uploadExistingContent, '\u65e7\u5185\u5bb9\uff1a' + existingSummary.parts.join(' / '), { existingContent: existingSummary.parts.join(' / ') });
        addLog('info', '\u63d0\u5ba1\u4e0a\u4f20\u8df3\u8fc7\uff1a\u5df2\u6709\u5185\u5bb9', item.sku + ' ' + existingSummary.parts.join(' / '));
        showToast(item.sku + ' ' + L.uploadExistingContent + '\uff0c\u5df2\u8df3\u8fc7\uff1b\u52fe\u9009\u91cd\u8bd5\u624d\u4f1a\u6e05\u7406\u540e\u91cd\u4f20');
        await closeTopProductDrawer({ skipDraftSave: true });
        return;
      }
      if (item.forceReplace) {
        updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6e05\u7406\u65e7\u6587\u4ef6');
        await clearProductReplaceUploadFiles(item.sku);
      }
      if (item.forceReplace) updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u51c6\u5907\u4e0a\u4f20', { forceReplace: false });
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4e0a\u4f20\u63a8\u54c1\u8d44\u6599');
      await uploadFileToProductField('\u63a8\u54c1\u8d44\u6599', xlsx, item.xlsxName || xlsx.name);
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4e0a\u4f20\u56fe\u5305\u7d20\u6750');
      await uploadFileToProductField('\u56fe\u5305\u7d20\u6750', zip, item.zipName || zip.name);
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6279\u91cf\u4e0a\u4f20');
      await openBatchUploadDialog();
      await uploadBatchZip(zip, item.zipName || zip.name);
      await matchBatchUploadForm();
      await confirmBatchUpload();
      await verifyBatchImagesUploaded(item.sku);
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4fdd\u5b58\u8349\u7a3f');
      const preReviewDraftSaved = await saveProductDraftBeforeClose();
      if (!preReviewDraftSaved) throw new Error('\u8349\u7a3f\u672a\u4fdd\u5b58\u6210\u529f');
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u63d0\u5ba1');
      await submitProductReview();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u5173\u95ed\u5546\u54c1\u9875');
      await closeTopProductDrawer({ skipDraftSave: true, allowReviewResultModal: true });
      archiveUploadItem(item);
      addLog('success', '\u63d0\u5ba1\u4e0a\u4f20\u6210\u529f', item.sku);
      showToast(item.sku + ' ' + L.uploadSuccess);
    } catch (error) {
      console.warn('PLM floating helper upload queue failed:', error);
      if (error && /产品信息开品中|不能编辑/.test(error.message || '')) {
        markUploadQueueBlocked(item, '\u5df2\u8df3\u8fc7', '\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d\uff0c\u4e0d\u80fd\u7f16\u8f91');
        addLog('info', '\u63d0\u5ba1\u4e0a\u4f20\u8df3\u8fc7\uff1a\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d', item.sku);
        showToast(item.sku + ' \u5df2\u8df3\u8fc7\uff1a\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d');
        await closeTopProductDrawer();
        return;
      }
      if (error && /\u4ea7\u54c1\u5df2\u505c\u7528|\u5f00\u53d1\u4eba\u5458?\u5df2\u505c\u7528/.test(error.message || '')) {
        markUploadQueueBlocked(item, L.uploadFailed, '\u4ea7\u54c1\u5df2\u505c\u7528');
        addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u4ea7\u54c1\u5df2\u505c\u7528', item.sku);
        showToast(item.sku + ' ' + L.uploadFailed + '\uff1a\u4ea7\u54c1\u5df2\u505c\u7528');
        await closeTopProductDrawer();
        return;
      }
      if (error && /\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a/.test(error.message || '')) {
        markUploadQueueBlocked(item, L.uploadFailed, '\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
        addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a', item.sku);
        showToast(item.sku + ' ' + L.uploadFailed + '\uff1a\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
        await closeTopProductDrawer({ skipDraftSave: true });
        return;
      }
      const message = error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef';
      markUploadQueueBlocked(item, L.uploadFailed, message);
      addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25', item.sku + ' ' + message);
      showToast(item.sku + ' ' + L.uploadFailed + '\uff1a' + message);
      try {
        await closeTopProductDrawer();
      } catch (closeError) {
        console.warn('PLM floating helper close after upload failure failed:', closeError);
        state.uploadRunning = false;
        saveUploadWorkerRunning(false);
        markUploadQueueBlocked(item, L.uploadFailed, message + '\uff1b\u5173\u95ed\u5f53\u524d\u5546\u54c1\u9875\u5931\u8d25\uff0c\u5df2\u6682\u505c');
        addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u5173\u95ed\u5546\u54c1\u9875\u5931\u8d25', item.sku + ' ' + (closeError && closeError.message ? closeError.message : '\u672a\u77e5\u9519\u8bef'));
        showToast('\u5173\u95ed\u5f53\u524d\u5546\u54c1\u9875\u5931\u8d25\uff0c\u5df2\u6682\u505c\uff0c\u8bf7\u624b\u52a8\u5904\u7406\u5f39\u7a97');
        throw closeError;
      }
    }
  }

  async function ensureUploadPageReadyForNextItem() {
    assertNoReviewConfirmModal();
    if (!getVisibleModal() && !getOpenProductDrawer()) return;
    await closeTopProductDrawer({ skipDraftSave: true });
    if (getVisibleModal() || getOpenProductDrawer()) {
      state.uploadRunning = false;
      saveUploadWorkerRunning(false);
      throw new Error('\u5f53\u524d\u5f39\u7a97\u6216\u5546\u54c1\u9875\u672a\u5173\u95ed\uff0c\u5df2\u6682\u505c\u4e0a\u4f20\u961f\u5217');
    }
  }

  async function recoverPurchaseEmptyRunningUpload() {
    if (!findPurchaseInfoEmptyError()) return false;
    const queue = loadUploadQueue();
    const running = getCurrentRunningUpload(queue);
    if (!running) return false;
    markUploadQueueBlocked(running, L.uploadFailed, '\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a', running.sku || '');
    await closeTopProductDrawer({ skipDraftSave: true });
    state.uploadQueue = loadUploadQueue();
    state.uploadHistory = loadUploadHistory();
    showToast(running.sku + ' ' + L.uploadFailed + '\uff1a\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    return true;
  }

  async function ensureProductManagementPage() {
    if (!/\/productManagementProduct/.test(location.pathname)) {
      location.href = location.origin + '/productManagementProduct?plmUploadWorker=1';
      await waitUntil(() => /\/productManagementProduct/.test(location.pathname), 15000, 300);
    }
    await waitUntil(() => document.body && document.body.innerText.includes('\u5546\u54c1\u7ba1\u7406'), 20000, 300);
  }

  async function searchProductManagementSku(sku) {
    const input = findProductSearchInput();
    if (!input) throw new Error('\u672a\u627e\u5230\u5546\u54c1\u641c\u7d22\u6846');
    setNativeInputValue(input, sku);
    const button = findVisibleButton('\u67e5\u8be2');
    if (!button) throw new Error('\u672a\u627e\u5230\u67e5\u8be2\u6309\u94ae');
    button.click();
    await waitUntil(() => findProductRowIdBySku(sku), 20000, 500);
  }

  function findProductSearchInput() {
    const roots = Array.from(document.querySelectorAll('.searchForm, .queryForm, .ant-form, .vxe-toolbar, .el-form, form, body')).filter(isVisibleElement);
    const inputs = Array.from(new Set(roots.flatMap((root) => Array.from(root.querySelectorAll('input')).filter(isVisibleElement))));
    const byPlaceholder = (patterns) => inputs.find((input) => {
      const text = compactText(input.getAttribute('placeholder') || input.placeholder || '');
      return patterns.some((pattern) => pattern.test(text));
    }) || null;
    const exactProductCode = byPlaceholder([/^\s*商品编码(?:\/|$|[\s，,、])/i, /^\s*商品编码/i]);
    if (exactProductCode) return exactProductCode;
    const labelMatched = inputs.find((input) => {
      const item = input.closest('.ant-form-item, .el-form-item, .vxe-form--item, .form-item, div');
      const text = compactText((item && (item.innerText || item.textContent)) || '');
      return /商品编码/.test(text) && !/商品名称|产品名称/.test(text.replace(/商品编码/g, ''));
    });
    if (labelMatched) return labelMatched;
    return byPlaceholder([/SKU/i]) || null;
  }

  function findProductRowIdBySku(sku) {
    const row = Array.from(document.querySelectorAll('tr[rowid], .vxe-body--row[rowid], .ant-table-row[rowid]'))
      .filter(isVisibleElement)
      .find((el) => getVisibleText(el).includes(sku));
    return row ? row.getAttribute('rowid') || '' : '';
  }

  async function openProductEditDrawer(sku) {
    if (getProductEditDrawerForSku(sku)) return;
    const rowId = findProductRowIdBySku(sku);
    if (!rowId) throw new Error('\u672a\u627e\u5230\u5546\u54c1\u884c');
    const row = Array.from(document.querySelectorAll('tr[rowid="' + cssEscape(rowId) + '"], .vxe-body--row[rowid="' + cssEscape(rowId) + '"]'))
      .filter(isVisibleElement)
      .find((el) => Array.from(el.querySelectorAll('button')).some((button) => compactText(button.innerText || button.textContent) === '\u7f16\u8f91'));
    const button = row && Array.from(row.querySelectorAll('button')).filter(isVisibleElement).find((el) => compactText(el.innerText || el.textContent) === '\u7f16\u8f91');
    if (!button) throw new Error('\u672a\u627e\u5230\u7f16\u8f91\u6309\u94ae');
    if (button.disabled || button.getAttribute('aria-disabled') === 'true' || /\bdisabled\b|\bis-disabled\b|ant-btn-disabled/.test(button.className || '')) {
      throw new Error('\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d\uff0c\u4e0d\u80fd\u7f16\u8f91');
    }
    button.click();
    const startedAt = Date.now();
    while (Date.now() - startedAt < 20000) {
      const drawer = getProductEditDrawerForSku(sku);
      if (drawer) return;
      if (getVisibleText(document.body).includes('\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d\uff0c\u4e0d\u80fd\u7f16\u8f91')) {
        throw new Error('\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d\uff0c\u4e0d\u80fd\u7f16\u8f91');
      }
      await wait(300);
    }
    throw new Error('\u672a\u6253\u5f00\u7f16\u8f91\u62bd\u5c49');
  }

  function getProductEditDrawerForSku(sku) {
    return Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer'))
      .filter(isVisibleElement)
      .find((drawer) => /\u7f16\u8f91\u5546\u54c1/.test(getVisibleText(drawer)) && (!sku || getVisibleText(drawer).includes(sku))) || null;
  }

  async function enterProductEditSecondStep(sku) {
    const drawer = getProductEditDrawerForSku(sku);
    if (!drawer) throw new Error('\u672a\u6253\u5f00\u7f16\u8f91\u62bd\u5c49');
    if (getVisibleText(drawer).includes('\u63a8\u54c1\u8d44\u6599')) return;
    await waitUntil(() => isProductCategoryReady(getProductEditDrawerForSku(sku)), 30000, 500);
    const readyDrawer = getProductEditDrawerForSku(sku);
    const button = readyDrawer && Array.from(readyDrawer.querySelectorAll('button')).filter(isVisibleElement).find((el) => compactText(el.innerText || el.textContent) === '\u4e0b\u4e00\u6b65');
    if (!button) throw new Error('\u672a\u627e\u5230\u4e0b\u4e00\u6b65');
    button.click();
    await waitUntil(() => {
      const nextDrawer = getProductEditDrawerForSku(sku);
      return nextDrawer && getVisibleText(nextDrawer).includes('\u63a8\u54c1\u8d44\u6599');
    }, 30000, 500);
  }

  function isProductCategoryReady(drawer) {
    if (!drawer) return false;
    const item = getScopedProductFormItem(drawer, '\u7c7b\u76ee');
    if (!item) return false;
    const text = compactText(item.innerText || item.textContent);
    const value = text.replace(/^\u7c7b\u76ee[*\uff1a:\s]*/, '').trim();
    const html = item.innerHTML || '';
    if (!value || /\u8bf7\u9009\u62e9|--/.test(value)) return false;
    if (/\u52a0\u8f7d|loading|ant-spin|ant-select-loading/.test(text + html)) return false;
    return true;
  }

  function getScopedProductFormItem(scope, labelText) {
    const labels = Array.from(scope.querySelectorAll('.ant-form-item-label label'));
    const normalizeLabel = (el) => compactText(el.innerText || el.textContent).replace(/[*\uff1a:]/g, '').trim();
    const label = labels.find((el) => normalizeLabel(el) === labelText) ||
      labels.find((el) => {
        const text = normalizeLabel(el);
        return text === labelText || text.startsWith(labelText + ' ') || text.startsWith(labelText + '\u3000');
      });
    return label ? label.closest('.ant-form-item') : null;
  }

  async function uploadFileToProductField(labelText, file, filename) {
    const item = getProductFormItem(labelText);
    if (!item) throw new Error('\u672a\u627e\u5230' + labelText);
    item.scrollIntoView({ block: 'center', inline: 'nearest' });
    await wait(300);
    await putFileIntoUploadItem(item, file, filename);
    await waitUploadItemDone(item, filename, 180000);
  }

  async function clearProductReplaceUploadFiles(sku) {
    const drawer = getProductEditDrawerForSku(sku) || Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    if (!drawer) throw new Error('\u672a\u6253\u5f00\u7f16\u8f91\u62bd\u5c49');
    let removedCount = 0;
    for (const labelText of PRODUCT_REPLACE_UPLOAD_LABELS) {
      const item = getScopedProductFormItem(drawer, labelText);
      if (!item) continue;
      item.scrollIntoView({ block: 'center', inline: 'nearest' });
      await wait(180);
      removedCount += await clearUploadFilesInFormItem(item, labelText);
    }
    if (removedCount) await wait(500);
  }

  function getProductReplaceUploadSummary(sku) {
    const drawer = getProductEditDrawerForSku(sku) || Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    const parts = [];
    let total = 0;
    if (!drawer) return { total, parts };
    for (const labelText of PRODUCT_REPLACE_UPLOAD_LABELS) {
      const item = getScopedProductFormItem(drawer, labelText);
      if (!item) continue;
      const count = getExistingUploadFileNodes(item).length;
      if (count) {
        total += count;
        parts.push(labelText + count);
      }
    }
    return { total, parts };
  }

  async function verifyBatchImagesUploaded(sku) {
    await waitUntil(() => {
      const summary = getBatchImageUploadSummary(sku);
      return summary.total > 0 ? summary : null;
    }, 30000, 500).catch(() => null);
    const summary = getBatchImageUploadSummary(sku);
    if (summary.total <= 0) {
      throw new Error('\u6279\u91cf\u4e0a\u4f20\u540e\u672a\u68c0\u6d4b\u5230\u4e3b\u56fe/\u8be6\u60c5\u56fe/SKU\u56fe');
    }
  }

  function getBatchImageUploadSummary(sku) {
    const drawer = getProductEditDrawerForSku(sku) || Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    const parts = [];
    let total = 0;
    if (!drawer) return { total, parts };
    for (const labelText of PRODUCT_BATCH_IMAGE_LABELS) {
      const item = getScopedProductFormItem(drawer, labelText);
      if (!item) continue;
      const count = getExistingUploadFileNodes(item).length;
      if (count) {
        total += count;
        parts.push(labelText + count);
      }
    }
    return { total, parts };
  }

  async function clearUploadFilesInFormItem(item, labelText) {
    let removed = 0;
    for (let round = 0; round < 12; round += 1) {
      const fileNodes = getExistingUploadFileNodes(item);
      if (!fileNodes.length) break;
      const before = fileNodes.length;
      const fileNode = fileNodes[0];
      const deleteTarget = findUploadDeleteTarget(fileNode);
      if (!deleteTarget) {
        throw new Error(labelText + '\u65e7\u6587\u4ef6\u65e0\u6cd5\u5220\u9664');
      }
      revealUploadActions(fileNode);
      await wait(80);
      clickElement(deleteTarget);
      await confirmUploadDeleteIfNeeded();
      await waitUntil(() => getExistingUploadFileNodes(item).length < before, 10000, 250);
      removed += 1;
    }
    if (getExistingUploadFileNodes(item).length) {
      throw new Error(labelText + '\u65e7\u6587\u4ef6\u672a\u6e05\u7a7a');
    }
    return removed;
  }

  function getExistingUploadFileNodes(item) {
    return Array.from(item.querySelectorAll('.filePreviewCard, .ant-upload-list-item, .ant-upload-list-picture-card-container, .ant-upload-list-text-container'))
      .filter(isVisibleElement)
      .filter((node) => !/ant-upload-list-item-uploading/.test(node.className || ''))
      .filter((node) => {
        const text = getVisibleText(node);
        const html = node.innerHTML || '';
        return /filePreviewCard|ant-upload-list-item|ant-upload-list-picture-card-container|ant-upload-list-text-container/.test(node.className || '') &&
          (/\u9884\u89c8|anticon-delete|delBtnIcon|ant-upload-list-item-name|ant-upload-list-item-card-actions/.test(text + html));
      });
  }

  function revealUploadActions(node) {
    if (!node) return;
    node.classList.add('pfh-force-upload-actions');
    node.querySelectorAll('.downloadBtn').forEach((el) => {
      el.style.display = 'block';
      el.style.visibility = 'visible';
      el.style.opacity = '1';
    });
    ['mouseenter', 'mouseover', 'mousemove'].forEach((type) => {
      dispatchDomEvent(node, type);
    });
  }

  function findUploadDeleteTarget(node) {
    const selectors = [
      '.delBtnIcon',
      '.anticon-delete.delBtnIcon',
      '.ant-upload-list-item-actions .anticon-delete',
      '.ant-upload-list-item-actions [aria-label*="delete" i]',
      '.ant-upload-list-item-actions [aria-label*="\u5220\u9664"]',
      '.ant-upload-list-item-actions [title*="\u5220\u9664"]',
      '.ant-upload-list-item-actions button',
      '.ant-upload-list-item-card-actions .anticon-delete',
      '.anticon-delete',
      '[aria-label*="delete" i]',
      '[aria-label*="\u5220\u9664"]',
      '[title*="\u5220\u9664"]',
    ];
    for (const selector of selectors) {
      const target = node.querySelector(selector);
      if (target) return getClickableElement(target);
    }
    const candidates = Array.from(node.querySelectorAll('button, span, i, svg, a')).filter((el) => {
      const text = compactText(el.innerText || el.textContent || '');
      const meta = [el.className || '', el.getAttribute('aria-label') || '', el.getAttribute('title') || ''].join(' ');
      return /\u5220\u9664|delete|remove|trash|close/i.test(text + ' ' + meta);
    });
    return candidates.length ? getClickableElement(candidates[0]) : null;
  }

  function getClickableElement(el) {
    return el && (el.closest('button, a, [role="button"], .downloadBtn, .ant-upload-list-item-card-actions-btn, .anticon-delete') || el);
  }

  function clickElement(el) {
    if (!el) return;
    if (typeof el.click === 'function') {
      el.click();
      return;
    }
    dispatchDomEvent(el, 'click');
  }

  function dispatchDomEvent(el, type) {
    if (!el) return false;
    try {
      el.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
      return true;
    } catch (error) {
      if (type === 'click' && typeof el.click === 'function') {
        el.click();
        return true;
      }
      console.warn('PLM floating helper dispatch event failed:', type, error);
      return false;
    }
  }

  async function confirmUploadDeleteIfNeeded() {
    await wait(250);
    const popup = Array.from(document.querySelectorAll('.ant-popover, .ant-modal'))
      .filter(isVisibleElement)
      .reverse()
      .find((el) => /\u5220\u9664|\u786e\u5b9a|\u786e\u8ba4/.test(getVisibleText(el)));
    if (!popup) return;
    const button = Array.from(popup.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((el) => /\u786e\u5b9a|\u786e\u8ba4|OK/i.test(compactText(el.innerText || el.textContent)));
    if (button) {
      button.click();
      await wait(250);
    }
  }

  function getProductFormItem(labelText) {
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    if (!drawer) return null;
    return getScopedProductFormItem(drawer, labelText);
  }

  async function putFileIntoUploadItem(item, file, filename) {
    const input = item.querySelector('input[type="file"]');
    if (!input) throw new Error('\u672a\u627e\u5230\u4e0a\u4f20\u63a7\u4ef6');
    const mime = (file && file.type && /^image\//.test(file.type)) ? file.type : guessMime(filename);
    const uploadFile = file instanceof File ? file : new File([file], filename, { type: mime });
    const namedFile = uploadFile.name === filename && uploadFile.type ? uploadFile : new File([uploadFile], filename, { type: uploadFile.type || mime, lastModified: uploadFile.lastModified || Date.now() });
    const dt = new DataTransfer();
    dt.items.add(namedFile);
    input.files = dt.files;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function waitUploadItemDone(item, filename, timeout) {
    const base = String(filename || '').replace(/^.*[\\\/]/, '');
    await waitUntil(() => {
      const html = item.innerHTML || '';
      const text = getVisibleText(item);
      if (/\u4e0a\u4f20\u5931\u8d25|ant-upload-list-item-error/.test(html + text)) throw new Error('\u4e0a\u4f20\u5931\u8d25');
      return !/ant-progress|uploading|\u4e0a\u4f20\u4e2d/.test(html + text) && (text.includes('\u9884\u89c8') || text.includes(base) || /ant-upload-list-item-done/.test(html));
    }, timeout || 120000, 800);
  }

  async function openBatchUploadDialog() {
    const button = findBatchUploadEntryButton();
    if (!button) throw new Error('\u672a\u627e\u5230\u6279\u91cf\u4e0a\u4f20\u5165\u53e3');
    button.click();
    await waitUntil(() => getVisibleText(document.body).includes('\u6279\u91cf\u4e0a\u4f20\u6587\u4ef6') && getVisibleModal(), 30000, 500);
  }

  function findBatchUploadEntryButton() {
    const bottomRightFloat = Array.from(document.querySelectorAll('.ant-float-btn'))
      .filter(isVisibleElement)
      .map((el) => ({ el, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 0 && rect.height > 0)
      .filter(({ rect }) => rect.right > window.innerWidth - 80 && rect.bottom > window.innerHeight - 80)
      .find(({ el, rect }) => isElementTopmostAtCenter(el, rect));
    if (bottomRightFloat) return bottomRightFloat.el;

    const candidates = Array.from(document.querySelectorAll('.vcb-chat-button, .vcb-chat-button-with-badge, .vcb-fixed-bottom-right'))
      .filter(isVisibleElement)
      .map((el) => ({ el, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 0 && rect.height > 0)
      .filter(({ rect }) => rect.left > window.innerWidth - 180 && rect.top > window.innerHeight - 180);
    return candidates.find(({ el, rect }) => {
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const top = document.elementFromPoint(x, y);
      return top && (top === el || el.contains(top) || top.closest('.vcb-chat-button, .vcb-chat-button-with-badge, .vcb-fixed-bottom-right') === el || top.closest('.ant-float-btn'));
    })?.el || null;
  }

  function isElementTopmostAtCenter(el, rect) {
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const top = document.elementFromPoint(x, y);
    return Boolean(top && (top === el || el.contains(top) || top.closest('.ant-float-btn') === el));
  }

  async function uploadBatchZip(file, filename) {
    const modal = getVisibleModal();
    if (!modal) throw new Error('\u672a\u6253\u5f00\u6279\u91cf\u4e0a\u4f20\u7a97\u53e3');
    await putFileIntoUploadItem(modal, file, filename);
    await waitUploadItemDone(modal, filename, 180000);
  }

  async function matchBatchUploadForm() {
    const modal = getVisibleModal();
    const button = modal && Array.from(modal.querySelectorAll('button')).filter(isVisibleElement).find((el) => compactText(el.innerText || el.textContent) === '\u5339\u914d\u8868\u5355');
    if (!button) throw new Error('\u672a\u627e\u5230\u5339\u914d\u8868\u5355');
    button.click();
    await waitUntil(() => {
      const text = getVisibleText(document.body);
      if (isBatchUploadMappingErrorText(text)) throw new Error('\u56fe\u5305ZIP\u5185\u90e8\u6587\u4ef6\u5206\u7ec4\u4e0d\u6b63\u786e');
      return text.includes('\u786e\u8ba4\u65e0\u8bef\uff0c\u5f00\u59cb\u4e0a\u4f20');
    }, 30000, 200);
  }

  function isBatchUploadMappingErrorText(text) {
    return /\u672a\u5728\u8868\u5355\u4e2d\u5339\u914d\u5230\u5bf9\u5e94\u7684\u5c5e\u6027|\u672a\u5339\u914d\u5230\u5bf9\u5e94\u7684\u5c5e\u6027|\u8868\u5355.*\u5339\u914d.*\u5c5e\u6027/.test(String(text || ''));
  }

  async function confirmBatchUpload() {
    const modal = getVisibleModal();
    const button = modal && Array.from(modal.querySelectorAll('button')).filter(isVisibleElement).find((el) => compactText(el.innerText || el.textContent) === '\u786e\u8ba4\u65e0\u8bef\uff0c\u5f00\u59cb\u4e0a\u4f20');
    if (!button) throw new Error('\u672a\u627e\u5230\u5f00\u59cb\u4e0a\u4f20');
    button.click();
    await waitUntil(() => !getVisibleModal() || getVisibleText(document.body).includes('\u6279\u91cf\u4e0a\u4f20\u5b8c\u6210'), 240000, 1000);
    await wait(1500);
  }

  async function submitProductReview() {
    const reviewResult = await clickReviewAndWaitConfirm();
    if (reviewResult === 'disabled') throw new Error('\u4ea7\u54c1\u5df2\u505c\u7528');
    if (reviewResult === 'purchase-empty') throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    if (reviewResult === 'minimum-order') {
      const filled = await fillMinimumOrderQuantityIfNeeded();
      if (!filled) throw new Error('\u672a\u6253\u5f00\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97');
      const retryResult = await clickReviewAndWaitConfirm();
      if (retryResult === 'disabled') throw new Error('\u4ea7\u54c1\u5df2\u505c\u7528');
      if (retryResult === 'purchase-empty') throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
      if (retryResult !== 'confirm') throw new Error('\u672a\u6253\u5f00\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97');
    }
    if (findProductDisabledError()) throw new Error('\u4ea7\u54c1\u5df2\u505c\u7528');
    if (findPurchaseInfoEmptyError()) throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    if (!getVisibleModal()) throw new Error('\u672a\u6253\u5f00\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97');
    const confirm = await waitUntil(() => findReviewConfirmButton(), 30000, 200);
    if (!confirm) throw new Error('\u672a\u627e\u5230\u786e\u8ba4\u63d0\u5ba1');
    confirm.click();
    const result = await waitUntil(() => {
      const text = getVisibleText(document.body);
      if (text.includes('\u4ea7\u54c1\u63d0\u5ba1\u6210\u529f') || text.includes('\u63d0\u5ba1\u6210\u529f')) {
        return isReviewConfirmModal(getVisibleModal()) ? '' : 'success';
      }
      if (findProductDisabledError()) return 'disabled';
      if (findPurchaseInfoEmptyError()) return 'purchase-empty';
      return '';
    }, 120000, 200);
    if (result === 'disabled') throw new Error('\u4ea7\u54c1\u5df2\u505c\u7528');
    if (result === 'purchase-empty') throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    await waitUntil(() => !isReviewConfirmModal(getVisibleModal()), 8000, 100);
  }

  function findReviewConfirmButton() {
    const modal = getVisibleModal();
    if (!modal) return null;
    return Array.from(modal.querySelectorAll('button')).filter(isVisibleElement).find((el) => {
      const text = compactText(el.innerText || el.textContent).replace(/\s+/g, '');
      const disabled = el.disabled || el.getAttribute('aria-disabled') === 'true' || /\bdisabled\b|ant-btn-loading|ant-btn-disabled/.test(el.className || '');
      return text === '\u63d0\u5ba1' && !disabled;
    }) || null;
  }

  async function clickReviewAndWaitConfirm() {
    const button = await waitUntil(() => findProductReviewButton(), 60000, 800);
    if (!button) throw new Error('\u672a\u627e\u5230\u63d0\u5ba1\u6309\u94ae');
    button.click();
    const startedAt = Date.now();
    while (Date.now() - startedAt < 8000) {
      const modal = getVisibleModal();
      if (isReviewConfirmModal(modal)) return 'confirm';
      if (findMinimumOrderQuantityErrorItem()) return 'minimum-order';
      if (findProductDisabledError()) return 'disabled';
      if (findPurchaseInfoEmptyError()) return 'purchase-empty';
      await wait(80);
    }
    if (findPurchaseInfoEmptyError()) return 'purchase-empty';
    if (findProductDisabledError()) return 'disabled';
    if (findMinimumOrderQuantityErrorItem()) return 'minimum-order';
    if (findReviewConfirmButton()) return 'confirm';
    return '';
  }

  function findProductReviewButton() {
    return findProductDrawerActionButton('\u63d0\u5ba1');
  }

  async function fillMinimumOrderQuantityIfNeeded() {
    const item = findMinimumOrderQuantityErrorItem();
    if (!item) return false;
    item.scrollIntoView({ block: 'center', inline: 'nearest' });
    await wait(300);
    const input = Array.from(item.querySelectorAll('input')).filter(isVisibleElement)[0];
    if (!input) return false;
    setNativeInputValue(input, '1000');
    await wait(300);
    return true;
  }

  function findMinimumOrderQuantityItem() {
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    if (!drawer) return null;
    return getScopedProductFormItem(drawer, '\u6700\u5c0f\u8d77\u8ba2\u91cf');
  }

  function findMinimumOrderQuantityErrorItem() {
    const item = findMinimumOrderQuantityItem();
    if (!item) return null;
    const input = Array.from(item.querySelectorAll('input')).filter(isVisibleElement)[0];
    const value = input ? compactText(input.value || '') : '';
    const text = getVisibleText(item);
    const hasError = /\u8bf7\u8f93\u5165\u6700\u5c0f\u8d77\u8ba2\u91cf|ant-form-item-has-error|ant-form-item-explain-error/.test(text + ' ' + (item.className || '') + ' ' + (item.innerHTML || ''));
    return hasError && !value ? item : null;
  }

  function findPurchaseInfoEmptyError() {
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer, .ant-drawer-open'))
      .filter(isVisibleElement)
      .pop();
    const scope = drawer || document.body;
    const text = getNodeText(scope);
    if (/\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a/.test(text)) return true;
    const errorRoot = drawer || document;
    const errorNodes = Array.from(errorRoot.querySelectorAll('.ant-form-item-explain-error, .ant-form-item-has-error, [role="alert"], .ant-message-notice, .ant-notification-notice'))
      .filter((node) => !node.closest('#' + PANEL_ID));
    if (errorNodes.some((node) => /\u91c7\u8d2d\u4fe1\u606f|\u4e0d\u53ef\u4e3a\u7a7a/.test(getNodeText(node) + ' ' + (node.className || '') + ' ' + (node.innerHTML || '')))) return true;
    const purchaseTitle = Array.from(scope.querySelectorAll('.ant-form-item-label label, .ant-collapse-header, .ant-anchor-link-title, [title]')).find((node) => compactText(node.innerText || node.textContent || node.getAttribute('title')) === '\u91c7\u8d2d\u4fe1\u606f');
    const purchaseSection = purchaseTitle && (purchaseTitle.closest('.ant-form-item') || purchaseTitle.parentElement);
    if (purchaseSection && /ant-form-item-has-error|ant-form-item-explain-error|\u4e0d\u53ef\u4e3a\u7a7a/.test((purchaseSection.className || '') + ' ' + (purchaseSection.innerHTML || ''))) return true;
    return false;
  }

  function findProductDisabledError() {
    const text = getVisibleText(document.body);
    return /\u5f00\u53d1\u4eba\u5458?\u5df2\u505c\u7528|\u5f53\u524d\u4ea7\u54c1\u5df2\u505c\u7528|\u4ea7\u54c1\u5df2\u505c\u7528/.test(text);
  }

  async function saveProductDraftBeforeClose() {
    const saveDraft = findSaveDraftButton();
    if (!saveDraft) throw new Error('\u672a\u627e\u5230\u4fdd\u5b58\u8349\u7a3f\u6309\u94ae');
    saveDraft.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    saveDraft.click();
    const result = await waitUntil(() => {
      const text = getNodeText(document.body);
      const plmNoticeText = getPlmNoticeText();
      if (/\u8349\u7a3f\u4fdd\u5b58\u6210\u529f|\u4fdd\u5b58\u8349\u7a3f.*\u6210\u529f|\u8349\u7a3f.*\u4fdd\u5b58.*\u6210\u529f|\u4fdd\u5b58\u6210\u529f/.test(text)) return 'saved';
      if (/\u8349\u672a\u4fdd\u5b58\u6210\u529f|\u4fdd\u5b58\u8349\u7a3f.*\u5931\u8d25|\u8349\u7a3f.*\u4fdd\u5b58.*\u5931\u8d25/.test(plmNoticeText)) return 'failed';
      if (findPurchaseInfoEmptyError()) return '';
      return '';
    }, 8000, 100).catch(() => '');
    return result === 'saved';
  }

  function findSaveDraftButton() {
    const bottomButton = findProductDrawerActionButton('\u4fdd\u5b58\u8349\u7a3f');
    if (bottomButton) return bottomButton;
    const drawers = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .ant-drawer-open, .pdmDetailDrawer'))
      .filter(isVisibleElement)
      .filter((drawer) => getNodeText(drawer).includes('\u7f16\u8f91\u5546\u54c1'));
    for (const drawer of drawers.reverse()) {
      const button = Array.from(drawer.querySelectorAll('button'))
        .filter(isVisibleElement)
        .find((el) => isActionButtonReady(el) && compactText(el.innerText || el.textContent).replace(/\s+/g, '') === '\u4fdd\u5b58\u8349\u7a3f');
      if (button) return button;
    }
    return Array.from(document.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((el) => isActionButtonReady(el) && compactText(el.innerText || el.textContent).replace(/\s+/g, '') === '\u4fdd\u5b58\u8349\u7a3f') || null;
  }

  function findProductDrawerActionButton(text) {
    const normalizedText = compactText(text).replace(/\s+/g, '');
    const drawers = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .ant-drawer-open, .pdmDetailDrawer'))
      .filter(isVisibleElement)
      .filter((drawer) => getNodeText(drawer).includes('\u7f16\u8f91\u5546\u54c1'));
    const candidates = drawers.flatMap((drawer) => {
      const drawerRect = drawer.getBoundingClientRect();
      return Array.from(drawer.querySelectorAll('button'))
        .filter(isVisibleElement)
        .filter(isActionButtonReady)
        .filter((button) => compactText(button.innerText || button.textContent).replace(/\s+/g, '') === normalizedText)
        .map((button) => ({ button, rect: button.getBoundingClientRect(), drawerRect }));
    }).filter(({ rect, drawerRect }) => rect.width > 0 && rect.height > 0 && rect.top >= drawerRect.top && rect.bottom <= drawerRect.bottom + 2);
    candidates.sort((a, b) => b.rect.top - a.rect.top || b.rect.left - a.rect.left);
    return candidates[0] ? candidates[0].button : null;
  }

  function isActionButtonReady(button) {
    return Boolean(button && !button.disabled && button.getAttribute('aria-disabled') !== 'true' && !/\bdisabled\b|ant-btn-loading|ant-btn-disabled/.test(button.className || ''));
  }

  function getPlmNoticeText() {
    return Array.from(document.querySelectorAll('.ant-message, .ant-message-notice, .ant-notification, .ant-notification-notice'))
      .filter((node) => !node.closest('#' + PANEL_ID))
      .map((node) => getNodeText(node))
      .join('\n');
  }

  async function saveDraftThenClosePurchaseEmptyProduct() {
    if (!findPurchaseInfoEmptyError()) throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    const existingModal = getVisibleModal();
    if (existingModal) {
      if (isCancelConfigModal(existingModal)) {
        cancelCancelConfigModal(existingModal);
        await waitUntil(() => !getVisibleModal(), 10000, 100);
        await waitUntil(() => findPurchaseInfoEmptyError(), 5000, 100);
      } else {
        closeVisibleModal(existingModal);
        await waitUntil(() => !getVisibleModal(), 10000, 100);
      }
    }
    const saved = await saveProductDraftBeforeClose();
    if (!saved) {
      state.uploadRunning = false;
      saveUploadWorkerRunning(false);
      throw new Error('\u8349\u7a3f\u672a\u4fdd\u5b58\u6210\u529f\uff0c\u5df2\u6682\u505c');
    }
    const running = getCurrentRunningUpload(loadUploadQueue());
    if (running) updateUploadItem(running, '\u8fdb\u884c\u4e2d', '\u5173\u95ed\u5546\u54c1\u9875');
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer, .ant-drawer-open'))
      .filter(isVisibleElement)
      .pop();
    const close = findDrawerCloseButton(drawer);
    if (!close) throw new Error('\u672a\u627e\u5230\u5546\u54c1\u9875\u5173\u95ed\u6309\u94ae');
    close.click();
    const modal = await waitUntil(() => {
      const topModal = getVisibleModal();
      return topModal && isCancelConfigModal(topModal) ? topModal : null;
    }, 10000, 100);
    confirmCancelConfigModal(modal);
    await waitUntil(() => !getVisibleModal() && !getOpenProductDrawer(), 10000, 100);
    return { draftSaved: true };
  }

  async function closeTopProductDrawer(options) {
    const result = { draftSaved: false };
    if (!(options && options.allowReviewResultModal)) assertNoReviewConfirmModal();
    if (options && options.allowReviewResultModal && isReviewConfirmModal(getVisibleModal())) {
      await waitUntil(() => !isReviewConfirmModal(getVisibleModal()), 8000, 100);
    }
    const existingModal = getVisibleModal();
    if (existingModal && isCancelConfigModal(existingModal)) {
      if (!(options && options.skipDraftSave) && findPurchaseInfoEmptyError()) {
        cancelCancelConfigModal(existingModal);
        await waitUntil(() => !getVisibleModal(), 10000, 100);
      } else {
        confirmCancelConfigModal(existingModal);
        await waitUntil(() => !getVisibleModal(), 10000, 100);
        return result;
      }
    } else if (existingModal) {
      closeVisibleModal(existingModal);
      await waitUntil(() => !getVisibleModal(), 10000, 100);
    }
    if (!(options && options.skipDraftSave) && findPurchaseInfoEmptyError()) {
      const saved = await saveProductDraftBeforeClose().catch((error) => {
        console.warn('PLM floating helper save draft before close failed:', error);
        return false;
      });
      result.draftSaved = saved;
      if (!saved) throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    }
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer, .ant-drawer-open'))
      .filter(isVisibleElement)
      .pop();
    const close = findDrawerCloseButton(drawer);
    if (!close) return result;
    close.click();
    await waitUntil(() => {
      const topModal = getVisibleModal();
      if (topModal) {
        if (isReviewConfirmModal(topModal)) throw new Error('\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u672a\u5904\u7406\uff0c\u5df2\u963b\u6b62\u5173\u95ed\u5546\u54c1\u9875');
        if (isCancelConfigModal(topModal)) {
          confirmCancelConfigModal(topModal);
          return false;
        }
        closeVisibleModal(topModal);
        return false;
      }
      const topDrawer = getOpenProductDrawer();
      return !topDrawer;
    }, 10000, 100);
    return result;
  }

  function closeVisibleModal(modal) {
    if (!modal) return false;
    if (isReviewConfirmModal(modal)) throw new Error('\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u672a\u5904\u7406\uff0c\u5df2\u963b\u6b62\u5173\u95ed\u5f39\u7a97');
    const close = Array.from(modal.querySelectorAll('button, .ant-modal-close, [aria-label]'))
      .filter(isVisibleElement)
      .find((button) => {
        const text = compactText(button.innerText || button.textContent).replace(/\s+/g, '');
        const signature = text + ' ' + (button.getAttribute('aria-label') || '') + ' ' + (button.className || '');
        return text === '\u53d6\u6d88' || /\u5173\u95ed|close|ant-modal-close/i.test(signature);
      });
    if (!close) throw new Error('\u672a\u627e\u5230\u5173\u95ed\u5f39\u7a97\u6309\u94ae');
    close.click();
    return true;
  }

  function confirmCancelConfigModal(modal) {
    const modalText = modal ? getVisibleText(modal) : '';
    if (!modal || !isCancelConfigModal(modal)) return false;
    const confirm = Array.from(modal.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((button) => compactText(button.innerText || button.textContent).replace(/\s+/g, '') === '\u786e\u5b9a');
    if (!confirm) throw new Error('\u672a\u627e\u5230\u53d6\u6d88\u914d\u7f6e\u786e\u5b9a\u6309\u94ae');
    confirm.click();
    return true;
  }

  async function closeCancelConfigModalIfPresent() {
    assertNoReviewConfirmModal();
    const modal = getVisibleModal();
    if (!modal || !isCancelConfigModal(modal)) return false;
    confirmCancelConfigModal(modal);
    await waitUntil(() => !getVisibleModal(), 10000, 100);
    return true;
  }

  function cancelCancelConfigModal(modal) {
    if (!modal || !isCancelConfigModal(modal)) return false;
    const cancel = Array.from(modal.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((button) => compactText(button.innerText || button.textContent).replace(/\s+/g, '') === '\u53d6\u6d88');
    if (!cancel) throw new Error('\u672a\u627e\u5230\u53d6\u6d88\u914d\u7f6e\u53d6\u6d88\u6309\u94ae');
    cancel.click();
    return true;
  }

  function isCancelConfigModal(modal) {
    const modalText = modal ? getVisibleText(modal) : '';
    return /\u5f53\u524d\u7c7b\u76ee\u5c5e\u6027\u4fe1\u606f\u672a\u4fdd\u5b58|\u662f\u5426\u786e\u8ba4\u53d6\u6d88\u914d\u7f6e/.test(modalText);
  }

  function isReviewConfirmModal(modal) {
    if (!modal || !isVisibleElement(modal)) return false;
    const text = getVisibleText(modal).replace(/\s+/g, '');
    if (/提审成功|产品提审成功|成功/.test(text)) return false;
    if (!/确定提交审批吗|确认提交审批|提交审批吗/.test(text)) return false;
    return Array.from(modal.querySelectorAll('button')).filter(isVisibleElement).some((button) => {
      const buttonText = compactText(button.innerText || button.textContent).replace(/\s+/g, '');
      const className = String(button.className || '');
      const disabled = button.disabled || button.getAttribute('aria-disabled') === 'true' || /\bdisabled\b|ant-btn-loading|ant-btn-disabled/.test(className);
      return buttonText === '\u63d0\u5ba1' && !disabled;
    });
  }

  function assertNoReviewConfirmModal() {
    const modal = getVisibleModal();
    if (isReviewConfirmModal(modal)) throw new Error('\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u672a\u5904\u7406\uff0c\u5df2\u963b\u6b62\u5173\u95ed\u6216\u5207\u6362\u4e0b\u4e00\u4e2a\u7f16\u7801');
  }

  function findDrawerCloseButton(drawer) {
    if (!drawer) return null;
    const drawerRect = drawer.getBoundingClientRect();
    return Array.from(drawer.querySelectorAll('button, .ant-drawer-close, [aria-label]'))
      .filter(isVisibleElement)
      .find((button) => {
        const text = compactText(button.innerText || button.textContent);
        const signature = text + ' ' + (button.getAttribute('aria-label') || '') + ' ' + (button.className || '');
        if (/\u5173\u95ed|close|ant-drawer-close/i.test(signature)) return true;
        const rect = button.getBoundingClientRect();
        const nearDrawerLeftTop = rect.top <= drawerRect.top + 80 && rect.left <= drawerRect.left + 120 && !text;
        const nearDrawerRightTop = rect.top <= drawerRect.top + 80 && rect.right >= drawerRect.right - 100 && !text;
        return nearDrawerLeftTop || nearDrawerRightTop;
      }) || null;
  }

  function getVisibleModal() {
    return Array.from(document.querySelectorAll('.ant-modal')).filter(isVisibleElement).pop() || null;
  }

  function getOpenProductDrawer() {
    return Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .ant-drawer-open'))
      .filter(isVisibleElement)
      .find((drawer) => getVisibleText(drawer).includes('\u7f16\u8f91\u5546\u54c1')) || null;
  }

  function findVisibleButton(text) {
    return Array.from(document.querySelectorAll('button')).filter(isVisibleElement).find((button) => compactText(button.innerText || button.textContent) === text) || null;
  }

  async function waitUntil(check, timeout, interval) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const value = check();
      if (value) return value;
      await wait(interval || 200);
    }
    throw new Error('\u7b49\u5f85\u8d85\u65f6');
  }

  function guessMime(filename) {
    const lower = String(filename || '').toLowerCase();
    if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.zip')) return 'application/zip';
    if (lower.endsWith('.rar')) return 'application/vnd.rar';
    return 'application/octet-stream';
  }

  function uploadFileKey(sku, kind) {
    return String(sku || '') + ':' + String(kind || '');
  }

  function runSearch(targetView) {
    const input = ensurePanel().querySelector('.pfh-search-input');
    if (input) input.value = normalizeSearchInput(input.value);
    state.searchQuery = input ? input.value.trim() : '';
    state.skuPage = 1;
    updateSearchClear();
    const matches = parseSearchTokens(state.searchQuery).length ? getSearchMatches(state.searchQuery) : [];
    if (matches.length) {
      const target = matches[0];
      const data = loadData(target.sku);
      state.selectedSku = target.sku;
      state.data = data ? normalizeData(data) : null;
      state.view = targetView === 'sizeImage' ? 'sizeImage' : 'detail';
      resetExcelState();
    }
    expandPanel();
    renderShell();
  }

  function clearSearch() {
    const input = ensurePanel().querySelector('.pfh-search-input');
    if (input) input.value = '';
    state.searchQuery = '';
    state.skuPage = 1;
    updateSearchClear();
    expandPanel();
    renderShell();
  }

  function updateSearchClear() {
    const panel = ensurePanel();
    const input = panel.querySelector('.pfh-search-input');
    const clear = panel.querySelector('.pfh-search-clear');
    if (!clear) return;
    clear.classList.toggle('is-visible', Boolean(input && input.value));
  }

  async function openSelectedProjectDetail() {
    if (state.openingProjectDetail) {
      showToast(L.openingDetail);
      return;
    }
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    const sku = data && data.sku;
    if (!sku) {
      showToast(L.excelNeedData);
      return;
    }
    state.openingProjectDetail = true;
    state.openingProjectDetailSku = sku;
    state.ignoreOutsideClickUntil = Date.now() + 2500;
    state.view = 'detail';
    state.selectedSku = sku;
    state.data = data;
    resetExcelState();
    expandPanel();
    renderShell(L.openingDetail);
    showToast(L.openingDetail);
    try {
      if (!(await ensureNewProductProjectPage())) throw new Error('new product project page not ready');
      let rowId = data.projectRowId || data.projectId || '';
      if (rowId && await clickProjectDetailByRowId(rowId, sku)) {
        cacheProjectRowId(sku, rowId);
        adoptOpenedProjectDrawer(sku);
        showToast(L.openDetailDone);
        return;
      }

      rowId = await queryProjectRowIdBySku(sku);
      if (!rowId || !(await clickProjectDetailByRowId(rowId, sku))) throw new Error('detail button not found');
      cacheProjectRowId(sku, rowId);
      adoptOpenedProjectDrawer(sku);
      showToast(L.openDetailDone);
    } catch (error) {
      console.warn('PLM floating helper open detail failed:', error);
      showToast(L.openDetailFailed);
    } finally {
      state.openingProjectDetail = false;
      window.setTimeout(() => {
        if (state.openingProjectDetailSku === sku) state.openingProjectDetailSku = '';
      }, 1000);
    }
  }

  async function openFirstCachedDetail() {
    const first = state.index[0] && state.index[0].sku ? state.index[0].sku : '';
    if (!first) {
      showToast(L.emptyList);
      return;
    }
    const data = normalizeData(loadData(first) || state.index[0]);
    state.selectedSku = first;
    state.data = data;
    state.view = 'detail';
    state.copywritingMode = false;
    expandPanel();
    renderShell();
  }

  function pinCurrentSearchResults() {
    const matches = getSearchMatches(state.searchQuery);
    if (!matches.length) return;
    matches.forEach((match, index) => {
      const item = state.index.find((entry) => entry.sku === match.sku);
      if (!item) return;
      item.pinned = true;
      // Reserve the very top slots for this batch while retaining result order.
      item.pinOrder = index + 1;
    });
    saveIndex();
    state.skuPage = 1;
    showToast('已置顶 ' + matches.length + ' 个编码');
    renderShell();
  }

  function adoptOpenedProjectDrawer(sku) {
    const drawer = getProjectDrawerForSku(sku);
    if (!drawer) return;
    const switchingSku = Boolean(state.selectedSku && state.selectedSku !== sku);
    state.drawer = drawer;
    state.sku = sku;
    state.selectedSku = sku;
    const cached = loadData(sku);
    if (cached) state.data = normalizeData(cached);
    else if (!state.data || state.data.sku !== sku) state.data = normalizeData({ sku });
    state.view = 'detail';
    if (switchingSku) state.copywritingMode = false;
    resetExcelState();
    expandPanel();
    renderShell();
  }

  async function ensureNewProductProjectPage() {
    if (isNewProductProjectPageReady()) return true;
    addLog('info', '\u6253\u5f00\u8be6\u60c5\uff1a\u5207\u6362\u5230\u9879\u76ee\u7ba1\u7406-\u65b0\u54c1\u5f00\u53d1');
    const tabButton = findTopTabByText('\u65b0\u54c1\u5f00\u53d1');
    if (tabButton) {
      clickElement(tabButton);
      const readyFromTab = await waitFor(() => isNewProductProjectPageReady(), 5000, 150);
      if (readyFromTab) return true;
    }
    const menuItem = findMenuItemByPathOrText('/projectManagementChemicalNew', '\u65b0\u54c1\u5f00\u53d1');
    if (menuItem) {
      clickElement(menuItem);
      const readyFromMenu = await waitFor(() => isNewProductProjectPageReady(), 8000, 150);
      if (readyFromMenu) return true;
    }
    addLog('error', '\u6253\u5f00\u8be6\u60c5\uff1a\u672a\u627e\u5230\u65b0\u54c1\u5f00\u53d1\u9876\u90e8\u6807\u7b7e\u6216\u5de6\u4fa7\u83dc\u5355');
    return isNewProductProjectPageReady();
  }

  function isNewProductProjectPageReady() {
    return /\/projectManagementChemicalNew/.test(location.pathname) && Boolean(findInputByPlaceholder('\u641c\u7d22\u5546\u54c1\u7f16\u7801') && findButtonByText('\u67e5\u8be2'));
  }

  function findTopTabByText(text) {
    const expected = compactText(text);
    return Array.from(document.querySelectorAll('.ant-tabs-tab, .ant-tabs-tab-btn, [role="tab"]'))
      .filter(isVisibleElement)
      .find((el) => compactText(el.innerText || el.textContent) === expected) || null;
  }

  function findMenuItemByPathOrText(path, text) {
    const expected = compactText(text);
    return Array.from(document.querySelectorAll('[data-menu-id], .ant-menu-item, .ant-menu-submenu-title, li'))
      .filter(isVisibleElement)
      .find((el) => (el.getAttribute('data-menu-id') || '') === path || compactText(el.innerText || el.textContent) === expected) || null;
  }

  async function queryProjectRowIdBySku(sku) {
    if (!(await ensureNewProductProjectPage())) return '';
    const input = findInputByPlaceholder('\u641c\u7d22\u5546\u54c1\u7f16\u7801');
    const button = findButtonByText('\u67e5\u8be2');
    if (!input || !button) return '';
    setNativeInputValue(input, sku);
    button.click();
    return await waitFor(() => findProjectRowIdBySku(sku), 5000, 150);
  }

  async function queryDesignTaskRowIdBySku(sku) {
    if (!(await ensureNewProductProjectPage())) return '';
    if (!(await ensureDesignTaskTab())) return '';
    return await queryProjectRowIdBySku(sku);
  }

  async function ensureDesignTaskTab() {
    const active = getActiveProjectWorkflowTabText();
    if (/^\u8bbe\u8ba1\u4efb\u52a1/.test(active)) return true;
    const tab = findProjectWorkflowTabByText('\u8bbe\u8ba1\u4efb\u52a1');
    if (!tab) {
      addLog('error', '\u73a9\u5177\u6807\u7b7e\uff1a\u672a\u627e\u5230\u8bbe\u8ba1\u4efb\u52a1\u9875\u7b7e');
      return false;
    }
    clickElement(tab);
    return Boolean(await waitFor(() => /^\u8bbe\u8ba1\u4efb\u52a1/.test(getActiveProjectWorkflowTabText()), 5000, 120));
  }

  function getActiveProjectWorkflowTabText() {
    const tab = Array.from(document.querySelectorAll('.filterTabs .ant-tabs-tab-active, .ant-tabs-tab-active'))
      .filter(isVisibleElement)
      .find((el) => /^(?:\u5168\u90e8|\u5f00\u53d1\u4efb\u52a1|\u8bbe\u8ba1\u4efb\u52a1|\u63a8\u5e7f\u4e0a\u67b6)/.test(compactText(el.innerText || el.textContent)));
    return tab ? compactText(tab.innerText || tab.textContent) : '';
  }

  function findProjectWorkflowTabByText(text) {
    const expected = compactText(text);
    return Array.from(document.querySelectorAll('.filterTabs .ant-tabs-tab, .filterTabs .ant-tabs-tab-btn, .ant-tabs-tab, [role="tab"]'))
      .filter(isVisibleElement)
      .find((el) => {
        const current = compactText(el.innerText || el.textContent);
        return current === expected || current.startsWith(expected);
      }) || null;
  }

  async function clickProjectDetailByRowId(rowId, sku) {
    if (isProjectDrawerOpenForSku(sku)) return true;
    const row = findOperationRowByRowId(rowId);
    if (!row) return false;
    const detailButton = Array.from(row.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((button) => compactText(button.innerText || button.textContent) === '\u8be6\u60c5');
    if (!detailButton) return false;
    detailButton.click();
    await waitFor(() => isProjectDrawerOpenForSku(sku), 3000, 120);
    return true;
  }

  function isProjectDrawerOpenForSku(sku) {
    return Boolean(getProjectDrawerForSku(sku));
  }

  function getProjectDrawerForSku(sku) {
    return Array.from(document.querySelectorAll('.ant-drawer-open, .ant-drawer'))
      .filter(isVisibleElement)
      .find((drawer) => {
        const text = getVisibleText(drawer);
        return /\u67e5\u770b\u9879\u76ee\u8be6\u60c5/.test(text) && (!sku || text.includes(sku));
      }) || null;
  }

  function injectDetailImageDownloadButtons() {
    const drawers = Array.from(document.querySelectorAll('.ant-drawer-open, .ant-drawer'))
      .filter(isVisibleElement)
      .filter((drawer) => /\u67e5\u770b\u9879\u76ee\u8be6\u60c5/.test(getVisibleText(drawer)));
    drawers.forEach((drawer) => {
      if (drawer.querySelector('.' + DETAIL_IMAGE_DOWNLOAD_CLASS)) return;
      const applyButton = findButtonLikeInScope(drawer, '\u5168\u90e8\u5e94\u7528');
      if (!applyButton) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = DETAIL_IMAGE_DOWNLOAD_CLASS + ' ant-btn ant-btn-default';
      button.textContent = '\u4e00\u952e\u4e0b\u8f7d\u56fe\u7247';
      button.style.marginLeft = '8px';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        downloadAllDetailImages(drawer, button);
      });
      applyButton.insertAdjacentElement('afterend', button);
    });
  }

  async function downloadAllDetailImages(drawer, button) {
    if (!drawer || button.dataset.running === '1') return;
    button.dataset.running = '1';
    const originalText = button.textContent;
    try {
      addLog('info', '\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u5f00\u59cb');
      const openDetailModal = getVisibleImageDetailModal();
      if (openDetailModal) {
        addLog('info', '\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u68c0\u6d4b\u5230\u5df2\u6253\u5f00\u7684\u67e5\u770b\u8be6\u60c5\u5f39\u7a97');
        await downloadImagesFromDetailModal(openDetailModal);
        button.textContent = '\u4e0b\u8f7d\u5b8c\u6210';
        return;
      }
      const viewButtons = findGeneratedImageViewButtons(drawer, ['\u8be6\u60c5\u56fe']);
      addLog('info', '\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u627e\u5230\u8be6\u60c5\u56fe\u67e5\u770b\u5165\u53e3 ' + viewButtons.length + '\u4e2a');
      if (viewButtons.length) {
        await downloadGeneratedImageViews(viewButtons, button);
        return;
      }
      const targets = findDetailImageDownloadTargets(drawer);
      addLog('info', '\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u627e\u5230\u4e0b\u8f7d\u5165\u53e3 ' + targets.length + '\u4e2a');
      if (!targets.length) {
        button.textContent = '\u672a\u627e\u5230\u56fe\u7247\u4e0b\u8f7d';
        addLog('error', '\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u672a\u627e\u5230\u8be6\u60c5\u56fe\u67e5\u770b\u5165\u53e3\u6216\u4e0b\u8f7d\u6309\u94ae', getVisibleText(drawer).slice(0, 180));
        showToast('\u672a\u627e\u5230\u8be6\u60c5\u56fe\u67e5\u770b\u5165\u53e3\u6216\u4e0b\u8f7d\u6309\u94ae');
        return;
      }
      for (let index = 0; index < targets.length; index += 1) {
        button.textContent = '\u4e0b\u8f7d ' + (index + 1) + '/' + targets.length;
        const target = targets[index];
        if (!document.body.contains(target)) continue;
        addLog('info', '\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u70b9\u51fb\u7b2c ' + (index + 1) + '/' + targets.length + ' \u4e2a\u5165\u53e3');
        revealUploadActions(target.closest('.filePreviewCard, .previewMasker, .ant-image, .ant-card, .ant-upload-list-item, [class*="file"], [class*="preview"]') || target);
        await wait(120);
        clickElement(target);
        await chooseDirectUseAndSubmitDownload();
        await wait(600);
      }
      button.textContent = '\u4e0b\u8f7d\u5b8c\u6210';
      addLog('success', '\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u5b8c\u6210');
      showToast('\u56fe\u7247\u4e0b\u8f7d\u5df2\u5904\u7406');
    } catch (error) {
      console.warn('PLM floating helper detail image download failed:', error);
      button.textContent = '\u4e0b\u8f7d\u5931\u8d25';
      addLog('error', '\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u5931\u8d25', error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef');
      showToast('\u56fe\u7247\u4e0b\u8f7d\u5931\u8d25\uff1a' + (error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef'));
    } finally {
      window.setTimeout(() => {
        button.textContent = originalText;
        button.dataset.running = '';
      }, 1800);
    }
  }

  async function downloadGeneratedImageViews(viewButtons, button) {
    for (let index = 0; index < viewButtons.length; index += 1) {
      const target = viewButtons[index];
      if (!document.body.contains(target)) continue;
      button.textContent = '\u67e5\u770b\u8be6\u60c5\u56fe ' + (index + 1) + '/' + viewButtons.length;
      addLog('info', '\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u70b9\u51fb\u8be6\u60c5\u56fe\u67e5\u770b\u5165\u53e3 ' + (index + 1) + '/' + viewButtons.length);
      clickElement(target);
      const modal = await waitUntil(() => {
        const latest = getVisibleImageDetailModal();
        return latest || null;
      }, 10000, 200);
      if (!modal) throw new Error('\u672a\u6253\u5f00\u8be6\u60c5\u56fe\u67e5\u770b\u5f39\u7a97');
      await downloadImagesFromDetailModal(modal);
      await wait(350);
    }
    button.textContent = '\u4e0b\u8f7d\u5b8c\u6210';
    addLog('success', '\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u8be6\u60c5\u56fe\u67e5\u770b\u5f39\u7a97\u5904\u7406\u5b8c\u6210');
    showToast('\u8be6\u60c5\u56fe\u4e0b\u8f7d\u5df2\u5904\u7406');
  }

  async function runHomeDetailImageDownload() {
    const sku = state.selectedSku || (state.data && state.data.sku) || '';
    addLog('info', '\u4e3b\u9875\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u70b9\u51fb\u5165\u53e3', sku || '\u672a\u9009\u4e2d SKU');
    const drawer = getProjectDrawerForSku(sku) || getCurrentImageDownloadDrawer();
    if (!drawer) {
      addLog('error', '\u4e3b\u9875\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u672a\u627e\u5230\u9879\u76ee\u8be6\u60c5/\u8bbe\u8ba1\u8d44\u6599\u62bd\u5c49');
      showToast('\u8bf7\u5148\u6253\u5f00\u9879\u76ee\u8be6\u60c5\u6216\u8bbe\u8ba1\u8d44\u6599');
      return;
    }
    addLog('info', '\u4e3b\u9875\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u627e\u5230\u62bd\u5c49', getVisibleText(drawer).slice(0, 120));
    let button = drawer.querySelector('.' + DETAIL_IMAGE_DOWNLOAD_CLASS);
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = DETAIL_IMAGE_DOWNLOAD_CLASS;
      button.textContent = '\u4e00\u952e\u4e0b\u8f7d\u56fe\u7247';
      button.style.display = 'none';
      drawer.appendChild(button);
    }
    showToast('\u5f00\u59cb\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247');
    await downloadAllDetailImages(drawer, button);
  }

  function getCurrentImageDownloadDrawer() {
    return Array.from(document.querySelectorAll('.ant-drawer-open, .ant-drawer'))
      .filter(isVisibleElement)
      .find((drawer) => {
        const text = getVisibleText(drawer);
        return /\u67e5\u770b\u9879\u76ee\u8be6\u60c5|\u8bbe\u8ba1\u8d44\u6599|\u6548\u679c\u56fe\u4fe1\u606f|\u8bbe\u8ba1\u6587\u4ef6/.test(text);
      }) || null;
  }

  function findDetailImageDownloadTargets(drawer) {
    const scopes = findImageFieldItems(drawer, ['\u8be6\u60c5\u56fe']);
    if (!scopes.length) {
      addLog('info', '\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u5f53\u524d\u9875\u9762\u6ca1\u6709\u53ef\u8bc6\u522b\u7684\u8be6\u60c5\u56fe\u8868\u5355\u9879');
      return [];
    }
    const roots = scopes.length ? scopes : [drawer];
    const primaryCards = roots.flatMap((root) => Array.from(root.querySelectorAll('.filePreviewCard, .filePreviewMainBox, .ant-upload-wrapper.draggerUploader, .ant-upload-drag.draggerUploader, .ant-upload-list-item, .ant-upload-list-picture-card-container')))
      .filter(isVisibleElement)
      .filter((node) => !node.closest('#' + PANEL_ID))
      .filter(isLikelyImageAssetCard);
    const fallbackCards = primaryCards.length ? [] : roots.flatMap((root) => Array.from(root.querySelectorAll('.previewMasker, .ant-image, .ant-card, [class*="file"], [class*="preview"]')))
      .filter(isVisibleElement)
      .filter((node) => !node.closest('#' + PANEL_ID))
      .filter((node) => !node.querySelector('.filePreviewCard, .ant-upload-list-item, .ant-upload-list-picture-card-container'))
      .filter(isLikelyImageAssetCard);
    const cards = primaryCards.length ? primaryCards : fallbackCards;
    const targets = [];
    cards.forEach((card) => {
      revealUploadActions(card);
      const target = findDownloadTargetInScope(card);
      if (target && !targets.includes(target)) targets.push(target);
    });
    if (targets.length) return targets;
    return roots.flatMap((root) => Array.from(root.querySelectorAll('button, a, [role="button"], span, i')))
      .filter(isVisibleElement)
      .filter((el) => !el.closest('#' + PANEL_ID))
      .filter((el) => isDownloadControl(el) && isNearImageAsset(el))
      .map(getClickableElement)
      .filter((el, index, arr) => el && arr.indexOf(el) === index);
  }

  function findGeneratedImageViewButtons(drawer, labels) {
    return findImageFieldItems(drawer, labels)
      .map((item) => {
        const controls = Array.from(item.querySelectorAll('button, a, [role="button"], span'))
          .filter(isVisibleElement)
          .filter((el) => /\u70b9\u51fb\u67e5\u770b|\u67e5\u770b/.test(compactText(el.innerText || el.textContent || '')))
          .map(getClickableElement)
          .filter(Boolean);
        return controls[0] || null;
      })
      .filter((el, index, arr) => el && arr.indexOf(el) === index);
  }

  function findImageFieldItems(drawer, labels) {
    const normalizedLabels = labels.map((label) => compactText(label));
    return Array.from(drawer.querySelectorAll('.ant-form-item'))
      .filter(isVisibleElement)
      .filter((item) => {
        const labelText = compactText((item.querySelector('.ant-form-item-label') || item).innerText || item.textContent || '');
        return normalizedLabels.some((label) => labelText === label || labelText.startsWith(label + 'AI') || labelText.startsWith(label + '\u70b9\u51fb') || labelText.startsWith(label + '\u5df2'));
      });
  }

  function isLikelyImageAssetCard(node) {
    const text = compactText(node.innerText || node.textContent || '');
    const html = node.innerHTML || '';
    const imageUrls = Array.from(node.querySelectorAll('img'))
      .map((img) => img.currentSrc || img.src || '')
      .filter((src) => src && !/\/filePic\/(?:word|pdf|excel|zip|rar|file|image)\.png/i.test(src));
    if (imageUrls.some((src) => /\.(?:png|jpe?g|webp|gif|bmp|tiff?)(?:\?|$)/i.test(src))) return true;
    if (/\.(?:docx?|pdf|xlsx?|zip|rar|psd)(?:\?|$)/i.test(text + ' ' + html)) return false;
    return /\.(?:png|jpe?g|webp|gif|bmp|tiff?)(?:\?|$)/i.test(text + ' ' + html) || /oss-pro\.plm\.westmonth\.cn/i.test(html);
  }

  function findDownloadTargetInScope(scope) {
    const selectors = [
      '[title*="\u4e0b\u8f7d"]',
      '[aria-label*="\u4e0b\u8f7d"]',
      '[title*="download" i]',
      '[aria-label*="download" i]',
      '.anticon-download',
      '.downloadBtn',
      '.downloadBtnIcon',
      '.anticon-vertical-align-bottom',
      '[aria-label="vertical-align-bottom"]',
      '[class*="download" i]',
      'button',
      'a',
      '[role="button"]',
    ];
    for (const selector of selectors) {
      const candidates = Array.from(scope.querySelectorAll(selector)).filter(isVisibleElement).filter(isDownloadControl);
      if (candidates.length) return getClickableElement(candidates[0]);
    }
    return null;
  }

  function isDownloadControl(el) {
    const text = compactText(el.innerText || el.textContent || '');
    const meta = [el.getAttribute('title') || '', el.getAttribute('aria-label') || '', el.className || '', el.getAttribute('class') || ''].join(' ');
    return /\u4e0b\u8f7d|download|vertical-align-bottom/i.test(text + ' ' + meta);
  }

  function isNearImageAsset(el) {
    const box = el.closest('.filePreviewCard, .previewMasker, .ant-image, .ant-card, .ant-upload-list-item, [class*="file"], [class*="preview"]');
    return Boolean(box && isLikelyImageAssetCard(box));
  }

  async function chooseDirectUseAndSubmitDownload() {
    const modal = await waitUntil(() => getVisibleModal(), 8000, 200);
    if (!modal) throw new Error('\u672a\u6253\u5f00\u4e0b\u8f7d\u5f39\u7a97');
    addLog('info', '\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u5df2\u6253\u5f00\u5f39\u7a97', getVisibleText(modal).slice(0, 120));
    if (isImageDetailDownloadModal(modal)) {
      await downloadImagesFromDetailModal(modal);
      return;
    }
    await chooseDirectUseAndSubmitDownloadInModal(modal);
  }

  function isImageDetailDownloadModal(modal) {
    const text = compactText(modal.innerText || modal.textContent || '');
    return /\u67e5\u770b\u8be6\u60c5/.test(text) && (getDetailModalImageUrls(modal).length > 0 || getDetailModalDownloadButtons(modal).length > 0) && !/\u76f4\u63a5\u4f7f\u7528/.test(text);
  }

  function getVisibleImageDetailModal() {
    return Array.from(document.querySelectorAll('.ant-modal'))
      .filter(isVisibleElement)
      .reverse()
      .find(isImageDetailDownloadModal) || null;
  }

  function getDetailModalDownloadButtons(modal) {
    return Array.from(modal.querySelectorAll('button, a, [role="button"], span'))
      .filter(isVisibleElement)
      .filter((el) => compactText(el.innerText || el.textContent) === '\u4e0b\u8f7d')
      .map(getClickableElement)
      .filter((el, index, arr) => el && arr.indexOf(el) === index);
  }

  async function downloadImagesFromDetailModal(modal) {
    const urls = getDetailModalImageUrls(modal);
    addLog('info', '\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u67e5\u770b\u8be6\u60c5\u5f39\u7a97\u56fe\u7247 URL ' + urls.length + '\u4e2a');
    const initialDownloads = getDetailModalDownloadButtons(modal);
    addLog('info', '\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u67e5\u770b\u8be6\u60c5\u5f39\u7a97\u4e0b\u8f7d\u6309\u94ae ' + initialDownloads.length + '\u4e2a');
    if (initialDownloads.length) {
      for (let index = 0; isVisibleElement(modal) && document.body.contains(modal); index += 1) {
        const downloads = getDetailModalDownloadButtons(modal);
        if (index >= downloads.length) break;
        const target = downloads[index];
        addLog('info', '\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u70b9\u51fb\u539f\u59cb\u4e0b\u8f7d\u6309\u94ae ' + (index + 1) + '/' + downloads.length);
        clickElement(target);
        const directModal = await waitUntil(() => {
          const latest = getVisibleModal();
          if (!latest || latest === modal) return null;
          return /\u76f4\u63a5\u4f7f\u7528|\u63d0\u4ea4\u5e76\u4e0b\u8f7d/.test(getVisibleText(latest)) ? latest : null;
        }, 8000, 200);
        if (!directModal) throw new Error('\u672a\u6253\u5f00\u76f4\u63a5\u4f7f\u7528\u5f39\u7a97');
        await chooseDirectUseAndSubmitDownloadInModal(directModal);
        await wait(350);
      }
      addLog('success', '\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u539f\u59cb\u4e0b\u8f7d\u6309\u94ae\u5904\u7406\u5b8c\u6210 ' + initialDownloads.length + '\u5f20');
      showToast('\u56fe\u7247\u5df2\u6309\u539f\u59cb\u4e0b\u8f7d\u6309\u94ae\u5904\u7406\uff1a' + initialDownloads.length + '\u5f20');
      const close = findButtonLikeInScope(modal, '\u5173\u95ed');
      if (close) clickElement(close);
      await waitUntil(() => !isVisibleElement(modal) || !document.body.contains(modal), 5000, 200).catch(() => null);
      return;
    }
    if (urls.length) {
      addLog('info', '\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1a\u672a\u627e\u5230\u539f\u59cb\u4e0b\u8f7d\u6309\u94ae\uff0c\u6539\u7528 URL \u515c\u5e95');
      for (let index = 0; index < urls.length; index += 1) {
        const filename = buildDetailImageFilename(urls[index], index);
        addLog('info', '\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1aURL \u515c\u5e95\u4e0b\u8f7d ' + (index + 1) + '/' + urls.length, filename);
        await downloadImageUrl(urls[index], filename);
        await wait(180);
      }
      addLog('success', '\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1aURL \u515c\u5e95\u4e0b\u8f7d\u5b8c\u6210 ' + urls.length + '\u5f20');
      showToast('\u56fe\u7247\u5df2 URL \u515c\u5e95\u4e0b\u8f7d\uff1a' + urls.length + '\u5f20');
      const closeDirect = findButtonLikeInScope(modal, '\u5173\u95ed');
      if (closeDirect) clickElement(closeDirect);
      await waitUntil(() => !isVisibleElement(modal) || !document.body.contains(modal), 5000, 200).catch(() => null);
      return;
    }
    let index = 0;
    while (isVisibleElement(modal) && document.body.contains(modal)) {
      const downloads = getDetailModalDownloadButtons(modal);
      if (index >= downloads.length) break;
      const target = downloads[index];
      index += 1;
      clickElement(target);
      const directModal = await waitUntil(() => {
        const latest = getVisibleModal();
        if (!latest || latest === modal) return null;
        return /\u76f4\u63a5\u4f7f\u7528|\u63d0\u4ea4\u5e76\u4e0b\u8f7d/.test(getVisibleText(latest)) ? latest : null;
      }, 8000, 200);
      if (!directModal) throw new Error('\u672a\u6253\u5f00\u76f4\u63a5\u4f7f\u7528\u5f39\u7a97');
      await chooseDirectUseAndSubmitDownloadInModal(directModal);
      await wait(350);
    }
    const close = findButtonLikeInScope(modal, '\u5173\u95ed');
    if (close) clickElement(close);
    await waitUntil(() => !isVisibleElement(modal) || !document.body.contains(modal), 5000, 200).catch(() => null);
  }

  function getDetailModalImageUrls(modal) {
    const urls = Array.from(modal.querySelectorAll('img'))
      .filter(isVisibleElement)
      .map((img) => stripOssResizeParams(img.currentSrc || img.src || ''))
      .filter((src) => src && !/\/filePic\//i.test(src) && /\.(?:png|jpe?g|webp|gif|bmp)(?:\?|$)/i.test(src));
    return Array.from(new Set(urls));
  }

  function buildDetailImageFilename(url, index) {
    const sku = (state.selectedSku || (state.data && state.data.sku) || 'PLM').replace(/[\\/:*?"<>|]+/g, '_');
    let name = '';
    try {
      name = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
    } catch (error) {
      name = '';
    }
    const extMatch = (name || url).match(/\.(png|jpe?g|webp|gif|bmp)(?:\?|$)/i);
    const ext = extMatch ? extMatch[1].toLowerCase().replace('jpeg', 'jpg') : 'png';
    const base = name ? name.replace(/\.(png|jpe?g|webp|gif|bmp)$/i, '') : ('image_' + String(index + 1).padStart(2, '0'));
    return sku + '_' + String(index + 1).padStart(2, '0') + '_' + base.replace(/[\\/:*?"<>|]+/g, '_') + '.' + ext;
  }

  function downloadImageUrl(url, filename) {
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          responseType: 'blob',
          timeout: 20000,
          onload: (res) => {
            if (res.status >= 200 && res.status < 300) {
              downloadBlob(res.response, filename);
              addLog('success', '\u56fe\u7247\u4e0b\u8f7d\u6210\u529f', filename);
              resolve(true);
            } else {
              addLog('error', '\u56fe\u7247\u4e0b\u8f7d HTTP \u5931\u8d25', filename + ' status=' + res.status);
              reject(new Error('image status ' + res.status));
            }
          },
          onerror: () => {
            addLog('error', '\u56fe\u7247\u4e0b\u8f7d\u8bf7\u6c42\u5931\u8d25', filename);
            reject(new Error('image request failed'));
          },
          ontimeout: () => {
            addLog('error', '\u56fe\u7247\u4e0b\u8f7d\u8d85\u65f6', filename);
            reject(new Error('image request timeout'));
          },
        });
        return;
      }
      fetchWithTimeout(url, 20000)
        .then((res) => {
          if (!res.ok) throw new Error('image status ' + res.status);
          return res.blob();
        })
        .then((blob) => {
          downloadBlob(blob, filename);
          addLog('success', '\u56fe\u7247\u4e0b\u8f7d\u6210\u529f', filename);
          resolve(true);
        })
        .catch(reject);
    });
  }

  async function chooseDirectUseAndSubmitDownloadInModal(modal) {
    const direct = await waitUntil(() => findButtonLikeInScope(modal, '\u76f4\u63a5\u4f7f\u7528') || findRadioLikeInScope(modal, '\u76f4\u63a5\u4f7f\u7528'), 8000, 200);
    if (!direct) throw new Error('\u672a\u627e\u5230\u76f4\u63a5\u4f7f\u7528');
    clickElement(direct);
    await wait(250);
    const submit = await waitUntil(() => findButtonLikeInScope(modal, '\u63d0\u4ea4\u5e76\u4e0b\u8f7d'), 8000, 200);
    if (!submit) throw new Error('\u672a\u627e\u5230\u63d0\u4ea4\u5e76\u4e0b\u8f7d');
    clickElement(submit);
    await waitUntil(() => !isVisibleElement(modal) || !document.body.contains(modal), 30000, 500).catch(() => null);
  }

  function findButtonLikeInScope(scope, text) {
    const expected = compactText(text);
    return Array.from(scope.querySelectorAll('button, a, [role="button"], span'))
      .filter(isVisibleElement)
      .find((el) => compactText(el.innerText || el.textContent) === expected) || null;
  }

  function findRadioLikeInScope(scope, text) {
    const expected = compactText(text);
    const labels = Array.from(scope.querySelectorAll('label, .ant-radio-wrapper, .ant-checkbox-wrapper, [role="radio"], [role="checkbox"]')).filter(isVisibleElement);
    const label = labels.find((el) => compactText(el.innerText || el.textContent).includes(expected));
    if (!label) return null;
    return label.querySelector('input, .ant-radio, .ant-checkbox') || label;
  }

  async function ensureProjectDrawerForData(data) {
    const sku = data && data.sku;
    if (!sku) return false;
    if (getProjectDrawerForSku(sku)) return true;
    if (!(await ensureNewProductProjectPage())) return false;
    let rowId = data.projectRowId || data.projectId || '';
    if (rowId && await clickProjectDetailByRowId(rowId, sku)) {
      return Boolean(await waitFor(() => getProjectDrawerForSku(sku), 5000, 150));
    }
    rowId = await queryProjectRowIdBySku(sku);
    if (!rowId) return false;
    const clicked = await clickProjectDetailByRowId(rowId, sku);
    if (clicked) cacheProjectRowId(sku, rowId);
    return clicked && Boolean(await waitFor(() => getProjectDrawerForSku(sku), 5000, 150));
  }

  async function ensureProjectBomDrawerForData(data, options) {
    const opts = options || {};
    const sku = data && data.sku;
    if (!sku) return null;
    const opened = getProjectBomDrawerForSku(sku);
    if (opened) return opened;
    const otherBom = getProjectBomDrawerForSku('');
    if (otherBom && !getVisibleText(otherBom).includes(sku)) {
      addLog('error', '\u73a9\u5177\u6807\u7b7e\uff1a\u5f53\u524d\u6253\u5f00\u7684\u7ed1BOM\u4e0d\u662f\u76ee\u6807 SKU', sku);
      return null;
    }
    await closeProjectDetailDrawerForSku(sku);
    if (!(await ensureNewProductProjectPage())) return null;
    if (!(await ensureDesignTaskTab())) return null;
    let rowId = data.projectRowId || data.projectId || '';
    if (rowId && await clickProjectBomByRowId(rowId, sku)) {
      return getProjectBomDrawerForSku(sku);
    }
    if (opts.batchRowOnly) {
      addLog('error', '\u73a9\u5177\u6807\u7b7e\uff1a\u6279\u91cf\u641c\u7d22\u884c\u5df2\u5931\u6548\uff0c\u672a\u91cd\u65b0\u5355\u72ec\u641c\u7d22', sku);
      return null;
    }
    rowId = await queryDesignTaskRowIdBySku(sku);
    if (!rowId) return null;
    const clicked = await clickProjectBomByRowId(rowId, sku);
    if (clicked) cacheProjectRowId(sku, rowId);
    return clicked ? getProjectBomDrawerForSku(sku) : null;
  }

  async function closeProjectDetailDrawerForSku(sku) {
    const drawer = getProjectDrawerForSku(sku);
    if (!drawer) return true;
    const close = findDrawerCloseButton(drawer);
    if (!close) return false;
    clickElement(close);
    await waitFor(() => !isVisibleElement(drawer) || !document.body.contains(drawer), 5000, 150);
    return true;
  }

  async function clickProjectBomByRowId(rowId, sku) {
    if (getProjectBomDrawerForSku(sku)) return true;
    const button = findOperationButtonByRowId(rowId, '\u7ed1BOM');
    if (!button) return false;
    clickElement(button);
    return Boolean(await waitFor(() => getProjectBomDrawerForSku(sku), 5000, 150));
  }

  function getProjectBomDrawerForSku(sku) {
    return Array.from(document.querySelectorAll('.ant-drawer-open, .ant-drawer'))
      .filter(isVisibleElement)
      .find((drawer) => {
        const text = getVisibleText(drawer);
        return /\u7ed1\u5b9aBOM|\u7ed1BOM/.test(text) && (!sku || text.includes(sku));
      }) || null;
  }

  function findBomLabelUploadItem(drawer) {
    if (!drawer) return null;
    const isLabelUploadScope = (el) => {
      if (!el || !el.querySelector('input[type="file"]')) return false;
      const text = getVisibleText(el);
      const compact = compactText(text);
      return /\u6807\u7b7e/.test(text) && (/\u5305\u6750\s*-\s*\u6807\u7b7e/.test(text) || compact.startsWith('\u6807\u7b7e'));
    };
    const upload = Array.from(drawer.querySelectorAll('.ant-upload, .ant-upload-wrapper, input[type="file"]'))
      .filter(isVisibleElement)
      .map((el) => el.closest('.materialCardItemHeader, .ant-collapse-item, .typeCard, .cardBox') || el.parentElement)
      .filter(Boolean)
      .find(isLabelUploadScope);
    if (upload) return upload;
    const cards = Array.from(drawer.querySelectorAll('.cardBox, .typeCard'))
      .filter(isVisibleElement)
      .filter((card) => card.querySelector('input[type="file"]'));
    const byTitle = cards.find((card) => compactText((card.querySelector('.cardTitle') || {}).innerText || '') === '\u6807\u7b7e');
    if (byTitle) return byTitle;
    const byMaterial = cards.find((card) => {
      const text = getVisibleText(card);
      return /\u6807\u7b7e/.test(text) && /\u5305\u6750\s*-\s*\u6807\u7b7e/.test(text);
    });
    if (byMaterial) return byMaterial;
    return Array.from(drawer.querySelectorAll('.ant-collapse-item, .materialCardItemHeader'))
      .filter(isVisibleElement)
      .find(isLabelUploadScope) || null;
  }

  async function saveProjectBomDrawer(drawer) {
    const button = findButtonLikeInScope(drawer, '\u6279\u91cf\u4fdd\u5b58');
    if (!button) throw new Error('\u672a\u627e\u5230\u7ed1BOM\u6279\u91cf\u4fdd\u5b58\u6309\u94ae');
    clickElement(button);
    await wait(600);
    const saved = await waitFor(() => {
      const text = getVisibleText(document.body);
      if (/\u4fdd\u5b58\u6210\u529f|\u64cd\u4f5c\u6210\u529f|\u6210\u529f/.test(text)) return true;
      return !/ant-btn-loading|loading/.test(String(button.className || ''));
    }, 30000, 300);
    if (!saved) throw new Error('\u7ed1BOM\u6279\u91cf\u4fdd\u5b58\u8d85\u65f6');
  }

  async function closeProjectBomDrawer(drawer) {
    const close = findDrawerCloseButton(drawer);
    if (!close) throw new Error('\u672a\u627e\u5230\u7ed1BOM\u62bd\u5c49\u5173\u95ed\u6309\u94ae');
    clickElement(close);
    const closed = await waitFor(() => !isVisibleElement(drawer) || !document.body.contains(drawer), 8000, 150);
    if (!closed) throw new Error('\u7ed1BOM\u62bd\u5c49\u672a\u6210\u529f\u5173\u95ed');
  }

  function findProjectRowIdBySku(sku) {
    const row = Array.from(document.querySelectorAll('tr[rowid], .vxe-body--row[rowid]'))
      .filter(isVisibleElement)
      .find((el) => getVisibleText(el).includes(sku));
    return row ? row.getAttribute('rowid') || '' : '';
  }

  function findOperationRowByRowId(rowId) {
    return Array.from(document.querySelectorAll('tr[rowid="' + cssEscape(rowId) + '"], .vxe-body--row[rowid="' + cssEscape(rowId) + '"]'))
      .filter(isVisibleElement)
      .find((row) => Array.from(row.querySelectorAll('button')).some((button) => compactText(button.innerText || button.textContent) === '\u8be6\u60c5')) || null;
  }

  function findOperationButtonByRowId(rowId, text) {
    const expected = compactText(text);
    const rows = Array.from(document.querySelectorAll('tr[rowid="' + cssEscape(rowId) + '"], .vxe-body--row[rowid="' + cssEscape(rowId) + '"]'))
      .filter(isVisibleElement);
    for (const row of rows) {
      const button = Array.from(row.querySelectorAll('button'))
        .filter(isVisibleElement)
        .find((el) => compactText(el.innerText || el.textContent) === expected);
      if (button) return button;
    }
    return null;
  }

  function cacheProjectRowId(sku, rowId) {
    if (!sku || !rowId) return;
    const data = normalizeData({ ...(loadData(sku) || state.data || {}), sku, projectRowId: String(rowId) });
    saveData(sku, data);
  }

  function findInputByPlaceholder(placeholder) {
    return Array.from(document.querySelectorAll('input'))
      .filter(isVisibleElement)
      .find((input) => input.getAttribute('placeholder') === placeholder) || null;
  }

  function findButtonByText(text) {
    return Array.from(document.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((button) => compactText(button.innerText || button.textContent) === text) || null;
  }

  function setNativeInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function waitFor(check, timeout, interval) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const value = check();
      if (value) return value;
      await wait(interval);
    }
    return '';
  }

  function resetExcelState() {
    state.excelPanelOpen = false;
    state.excelExtra = null;
    state.excelMissing = [];
    state.excelStatus = '';
    state.excelPackQty = '';
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    state.excelPurchasePrice = String(data && data.purchasePrice || '6');
  }

  function syncExcelInputs() {
    const panel = ensurePanel();
    const pack = panel.querySelector('.pfh-excel-pack');
    const price = panel.querySelector('.pfh-excel-price');
    if (pack) state.excelPackQty = pack.value;
    if (price) state.excelPurchasePrice = price.value;
  }

  async function prepareExcelInfo() {
    syncExcelInputs();
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) {
      showToast(L.excelNeedData);
      return;
    }
    state.view = 'detail';
    state.selectedSku = data.sku;
    state.data = data;
    if (data.purchasePrice) state.excelPurchasePrice = String(data.purchasePrice);
    state.excelPanelOpen = true;
    state.excelExtra = null;
    state.excelMissing = [];
    state.excelStatus = L.excelPreparing;
    renderShell();
    try {
      if (!(await ensureProjectDrawerForData(data))) throw new Error('target project drawer not open');
      const extra = await collectExcelExtraData(data.sku);
      const excelData = normalizeData(mergeData(data, extra.liveData || {}));
      cacheProductThumb(excelData, extra);
      state.excelExtra = { extra, excelData };
      state.excelMissing = getExcelMissingFields(excelData, extra);
      state.excelStatus = state.excelMissing.length ? L.excelIncomplete : L.excelReady;
      await fillRecommendedPackQty(excelData);
      await fillRecommendedPurchasePrice(excelData, extra);
      if (state.excelMissing.length) showExcelMissingToast();
    } catch (error) {
      console.warn('PLM floating helper excel prepare failed:', error);
      state.excelExtra = null;
      state.excelMissing = ['\u8bbe\u8ba1\u8d44\u6599'];
      state.excelStatus = L.excelIncomplete;
      addLog('error', '\u83b7\u53d6\u8868\u683c\u4fe1\u606f\u5931\u8d25', data.sku + ' ' + formatErrorMessage(error));
      recordDataQuality(data, 'excelPrepareFailed');
      showExcelMissingToast();
    }
    renderShell();
  }

  function cacheProductThumb(data, extra) {
    const sku = data && data.sku;
    const src = extra && extra.isSkuDesignImage && (extra.skuImageUrl || extra.imageUrl || extra.skuImageFallbackUrl || extra.imageFallbackUrl);
    if (!sku || !src) return;
    const thumbData = normalizeData({
      ...data,
      skuImageUrl: extra.skuImageUrl || extra.imageUrl || '',
      skuImageFallbackUrl: extra.skuImageFallbackUrl || extra.imageFallbackUrl || extra.skuImageUrl || extra.imageUrl || '',
      skuImageSource: 'effectImage',
    });
    saveDataDirect(sku, thumbData);
    if ((state.data && state.data.sku === sku) || (!state.data && state.selectedSku === sku)) state.data = thumbData;
    upsertIndex(thumbData);
  }

  function getExcelMissingFields(data, extra) {
    const missing = [];
    if (!extra.englishName) missing.push('\u82f1\u6587\u4ea7\u54c1\u540d');
    if (!extra.ingredients) missing.push('\u6210\u5206');
    if (!extra.isSkuDesignImage || (!extra.imageUrl && !extra.imageFallbackUrl)) missing.push('\u4ea7\u54c1\u56fe');
    if (!extra.benchmarkLink) missing.push('\u5bf9\u6807\u94fe\u63a5');
    if (!data.productLength || !data.productWidth || !data.productHeight) missing.push('\u4ea7\u54c1\u5c3a\u5bf8');
    if (!data.packageLength || !data.packageWidth || !data.packageHeight) missing.push('\u5305\u88c5\u5c3a\u5bf8');
    if (!data.netContent) missing.push('\u51c0\u542b\u91cf');
    if (!data.grossWeight) missing.push('\u6bdb\u91cd');
    return missing;
  }

  function showExcelMissingToast() {
    showToast(L.excelMissing + state.excelMissing.join('\u3001'));
  }

  async function generateExcelFromCurrent() {
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) {
      showToast(L.excelNeedData);
      return;
    }
    if (!window.ExcelJS) {
      showToast(L.excelNeedLibrary);
      return;
    }
    syncExcelInputs();
    const packQty = normalizePackQty(state.excelPackQty);
    const purchasePrice = state.excelPurchasePrice === '' ? '6' : state.excelPurchasePrice;
    if (!state.excelExtra || !state.excelExtra.excelData || state.excelExtra.excelData.sku !== data.sku) {
      state.excelPanelOpen = true;
      state.excelStatus = '\ud83d\udd34 \u8bf7\u5148\u83b7\u53d6\u8868\u683c\u4fe1\u606f';
      renderShell();
      showToast('\ud83d\udd34 \u8bf7\u5148\u83b7\u53d6\u8868\u683c\u4fe1\u606f');
      return;
    }
    if (state.excelMissing.length) showExcelMissingToast();
    try {
      const extra = state.excelExtra.extra;
      const excelData = state.excelExtra.excelData;
      const fileName = sanitizeExcelFileName(buildExcelFileName(excelData, extra));
      const saveTarget = await chooseExcelSaveTarget(fileName);
      if (!saveTarget) {
        state.excelStatus = L.excelSaveCanceled;
        renderShell();
        showToast(L.excelSaveCanceled);
        return;
      }
      showToast(L.excelGenerating);
      const workbook = new window.ExcelJS.Workbook();
      await workbook.xlsx.load(base64ToArrayBuffer(TEMPLATE_XLSX_BASE64));
      const sheet = workbook.getWorksheet('Sheet1') || workbook.worksheets[0];
      state.excelStatus = L.excelImageLoading;
      renderShell();
      const excelImageSource = getExcelImageSource(excelData, extra);
      const imageInfo = excelImageSource.imageUrl ? await fetchImageForExcel(excelImageSource.imageUrl, excelImageSource.imageFallbackUrl).catch((error) => {
        console.warn('PLM floating helper image fetch failed:', error);
        return null;
      }) : null;
      cacheProductThumb(data, extra);

      setCell(sheet, 'A4', buildExcelKeyword(excelData, extra));
      setCell(sheet, 'B4', excelData.name || extra.chineseName || '');
      setCell(sheet, 'C4', '');
      setCell(sheet, 'E4', compactText(packQty));
      setCell(sheet, 'G4', excelData.sku || '');
      sheet.getCell('H4').value = { formula: 'IF(LEN(J4)-LEN(SUBSTITUTE(J4,"*",""))=2,"\u76d2\u88c5",IF(LEN(J4)-LEN(SUBSTITUTE(J4,"*",""))=1,"\u888b\u88c5",""))' };
      setCell(sheet, 'I4', formatExcelDimFromParts([excelData.productLength, excelData.productWidth, excelData.productHeight]) || formatExcelDim(excelData.productNums, []));
      setCell(sheet, 'J4', formatExcelDimFromParts([excelData.packageLength, excelData.packageWidth, excelData.packageHeight]) || formatExcelDim(excelData.packageNums, []));
      setCell(sheet, 'L4', formatIngredientsForExcel(extra.ingredients));
      setCell(sheet, 'M4', normalizeExcelUnit(excelData.netContent));
      setCell(sheet, 'N4', normalizeExcelUnit(excelData.grossWeight));
      setCell(sheet, 'O4', normalizeExcelNumberOrText(purchasePrice));
      setCell(sheet, 'P4', getReturnDateText(7));
      setCell(sheet, 'S4', extra.benchmarkLink || '');

      if (imageInfo) {
        state.excelStatus = L.excelPacking;
        renderShell();
        const imageId = workbook.addImage({ base64: imageInfo.dataUrl, extension: imageInfo.extension });
        sheet.addImage(imageId, getExcelImageAnchor(imageInfo));
      }
      const packBoxKey = buildPackBoxKey(excelData);
      if (packBoxKey) {
        const recommended = await fetchPackRecommendation(packBoxKey).catch(() => null);
        if (recommended && recommended.packCount) {
          state.excelStatus = '推荐装箱数: ' + recommended.packCount;
          renderShell();
        }
        if (packQty) {
          await savePackRecord(packBoxKey, packQty, data.sku).catch((error) => console.warn('PLM floating helper pack record failed:', error));
        }
      }
      const buffer = await workbook.xlsx.writeBuffer();
      state.excelStatus = L.excelDownloading + ' ' + fileName;
      renderShell();
      console.info('PLM floating helper Excel filename:', fileName);
      await saveExcelBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName, saveTarget);
      recordCommerceInsight(excelData, extra, {
        price: purchasePrice,
        packQty,
        source: 'excel',
        fileName,
      });
      upsertDailyLedgerFromData(excelData, { status: '制作中', stage: '表格/上传处理中', note: '已生成 Excel' });
      state.excelStatus = L.excelDone;
      renderShell();
      showToast(L.excelDone);
    } catch (error) {
      console.warn('PLM floating helper excel failed:', error);
      state.excelStatus = L.excelFailed;
      renderShell();
      showToast(L.excelFailed);
    }
  }

  async function generateToyLabelFromCurrent(options) {
    const opts = options || {};
    let data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) {
      showToast(L.excelNeedData);
      return;
    }
    syncExcelInputs();
    try {
      if (!opts.skipExcelPrepare && (!state.excelExtra || !state.excelExtra.excelData || state.excelExtra.excelData.sku !== data.sku)) {
        await prepareExcelInfo();
        data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
      }
      const matchingExcel = state.excelExtra && state.excelExtra.excelData && state.excelExtra.excelData.sku === data.sku ? state.excelExtra : null;
      let extra = matchingExcel && matchingExcel.extra ? matchingExcel.extra : {};
      let labelData = normalizeData((matchingExcel && matchingExcel.excelData) || data);
      state.excelStatus = L.labelGenerating;
      renderShell();
      showToast(L.labelGenerating);

      const ensuredImage = await ensureToyLabelProductImage(labelData, extra);
      labelData = ensuredImage.data;
      extra = ensuredImage.extra;
      const imageSource = ensuredImage.imageSource;
      const productImage = imageSource.imageUrl ? await fetchImageForExcel(imageSource.imageUrl, imageSource.imageFallbackUrl).catch((error) => {
        console.warn('PLM floating helper label product image fetch failed:', error);
        addLog('error', '\u73a9\u5177\u6807\u7b7e\uff1a\u4ea7\u54c1\u56fe\u83b7\u53d6\u5931\u8d25', error && error.message ? error.message : '');
        return null;
      }) : null;
      if (!productImage || !productImage.dataUrl) {
        throw new Error('\u672a\u80fd\u8bfb\u53d6 SKU \u6548\u679c\u56fe\uff0c\u5df2\u505c\u6b62\u751f\u6210\u548c\u4e0a\u4f20\uff0c\u907f\u514d\u53ea\u5269\u6761\u7801\u7684\u6807\u7b7e\u8bf4\u660e\u56fe');
      }
      const barcodeImage = await getBarcodeForToyLabel(labelData.sku);
      const size = getToyLabelSizeCm(labelData);
      const printCanvas = await renderToyLabelPrintCanvas({
        sku: labelData.sku,
        widthCm: size.width,
        heightCm: size.height,
        productImage,
        barcodeImage,
      });
      const previewCanvas = await renderToyLabelPreviewCanvas({
        sku: labelData.sku,
        widthCm: size.width,
        heightCm: size.height,
        printCanvas,
      });
      const baseName = cleanFileNamePart([labelData.brand, labelData.name, labelData.sku].filter(Boolean).join(' ')) || labelData.sku;
      const sizeName = trimCm(size.width) + 'x' + trimCm(size.height) + 'cm';
      const previewBlob = await canvasToBlob(previewCanvas, 'image/jpeg', 0.95);
      const printBlob = await canvasToBlob(printCanvas, 'image/jpeg', 0.95);
      const psdBlob = canvasToFlatPsdBlob(printCanvas, printCanvas.width / ((Number(size.width) || 4) * CM_TO_INCH));
      const previewFilename = baseName + ' \u6807\u7b7e\u8bf4\u660e\u56fe.jpg';
      const printFilename = baseName + ' \u6807\u7b7e\u5370\u5237' + sizeName + '.jpg';
      const materialCode = cleanFileNamePart(labelData.printCode || '');
      const productName = cleanFileNamePart([labelData.brand, labelData.name].filter(Boolean).join('')) || labelData.sku;
      const psdFilename = '\u6807\u7b7e \uff08' + sizeName + '\uff09' + [materialCode, productName].filter(Boolean).join(' ') + '.psd';
      if (Array.isArray(opts.collectFiles)) {
        const generatedFiles = [
          { sku: labelData.sku, filename: previewFilename, blob: previewBlob },
          { sku: labelData.sku, filename: printFilename, blob: printBlob },
          { sku: labelData.sku, filename: psdFilename, blob: psdBlob }
        ];
        opts.collectFiles.push(...generatedFiles);
        await stageToyLabelBatchFiles(generatedFiles, opts.batchSignature || state.toyLabelBatchPreparedSignature);
      } else {
        downloadBlob(previewBlob, previewFilename);
        await wait(250);
        downloadBlob(printBlob, printFilename);
        await wait(250);
        downloadBlob(psdBlob, psdFilename);
      }
      if (!opts.skipBomUpload) await uploadToyLabelPreviewToBom(labelData, previewBlob, previewFilename, opts);
      state.excelStatus = L.labelDone;
      upsertDailyLedgerFromData(labelData, { status: '制作中', stage: '图包/标签/纸盒处理中', note: '已生成玩具标签', labelFileState: 'done', labelFileDone: true });
      renderShell();
      addLog('success', '\u73a9\u5177\u6807\u7b7e\u751f\u6210\u6210\u529f', labelData.sku);
      showToast(L.labelDone);
      return true;
    } catch (error) {
      console.warn('PLM floating helper label failed:', error);
      state.excelStatus = L.labelFailed;
      renderShell();
      addLog('error', '\u73a9\u5177\u6807\u7b7e\u751f\u6210\u5931\u8d25', error && error.message ? error.message : '');
      showToast(L.labelFailed);
      return false;
    }
  }

  async function uploadToyLabelPreviewToBom(data, blob, filename, options) {
    const sku = data && data.sku;
    if (!sku) throw new Error('\u672a\u627e\u5230 SKU\uff0c\u65e0\u6cd5\u4e0a\u4f20\u5230\u7ed1BOM');
    addLog('info', '\u73a9\u5177\u6807\u7b7e\uff1a\u51c6\u5907\u4e0a\u4f20\u8bf4\u660e\u56fe\u5230\u7ed1BOM', sku);
    const drawer = await ensureProjectBomDrawerForData(data, options);
    if (!drawer) throw new Error('\u672a\u6253\u5f00\u5f53\u524d\u7f16\u7801\u7684\u7ed1BOM\u62bd\u5c49');
    const uploadItem = await waitUntil(() => findBomLabelUploadItem(drawer), 12000, 250);
    if (!uploadItem) throw new Error('\u672a\u627e\u5230\u7ed1BOM\u4e2d\u6807\u7b7e\u884c\u7684\u4e0a\u4f20\u52a0\u53f7');
    uploadItem.scrollIntoView({ block: 'center', inline: 'nearest' });
    await wait(180);
    await putFileIntoUploadItem(uploadItem, blob, filename);
    await waitUploadItemDone(uploadItem, filename, 180000);
    addLog('success', '\u73a9\u5177\u6807\u7b7e\uff1a\u8bf4\u660e\u56fe\u5df2\u4e0a\u4f20\u5230\u7ed1BOM\u6807\u7b7e', filename);
    await saveProjectBomDrawer(drawer);
    await closeProjectBomDrawer(drawer);
    addLog('success', '\u73a9\u5177\u6807\u7b7e\uff1a\u7ed1BOM\u5df2\u6279\u91cf\u4fdd\u5b58\u5e76\u5173\u95ed', sku);
  }

  function getToyLabelSizeCm(data) {
    return { width: 4, height: 3 };
  }

  function getToyLabelImageSource(data, extra) {
    const batchImageUrl = data && (data.toyLabelProductImageUrl || data.toyLabelProductImageFallbackUrl || data.productListImageUrl || data.productListImageFallbackUrl);
    if (batchImageUrl) {
      return {
        imageUrl: data.toyLabelProductImageUrl || data.productListImageUrl || batchImageUrl,
        imageFallbackUrl: data.toyLabelProductImageFallbackUrl || data.productListImageFallbackUrl || data.toyLabelProductImageUrl || data.productListImageUrl || batchImageUrl,
      };
    }
    const source = getExcelImageSource(data, extra);
    const imageUrl = stripOssResizeParams(source.imageUrl || source.imageFallbackUrl || '');
    const imageFallbackUrl = stripOssResizeParams(source.imageFallbackUrl || '');
    return {
      imageUrl: imageUrl || source.imageUrl || '',
      imageFallbackUrl: imageFallbackUrl || imageUrl || source.imageFallbackUrl || '',
    };
  }

  async function getBarcodeForToyLabel(sku) {
    return { canvas: renderCode128Barcode(sku, 980, 260), source: 'generated-code128b' };
  }

  async function ensureToyLabelProductImage(data, extra) {
    const cachedSource = getToyLabelImageSource(data, extra);
    if (cachedSource.imageUrl || cachedSource.imageFallbackUrl) {
      return { data, extra, imageSource: cachedSource };
    }
    if (!(await ensureProjectDrawerForData(data))) {
      throw new Error('\u672a\u6253\u5f00\u5f53\u524d SKU \u7684\u9879\u76ee\u8be6\u60c5\uff0c\u65e0\u6cd5\u8bfb\u53d6\u6548\u679c\u56fe');
    }
    const drawer = getProjectDrawerForSku(data.sku) || getProjectDrawer();
    const imageInfo = drawer ? await collectProductImageInfo(drawer, {
      sku: data.sku,
      allowPreview: true,
      restoreTab: true,
      designTimeout: 4500,
    }) : { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    const imageUrl = imageInfo.isSkuDesignImage && (imageInfo.imageUrl || imageInfo.imageFallbackUrl);
    if (!imageUrl) {
      throw new Error('\u672a\u627e\u5230 SKU \u6548\u679c\u56fe\uff0c\u5df2\u505c\u6b62\u751f\u6210\u548c\u4e0a\u4f20\uff0c\u907f\u514d\u4e0a\u4f20\u7a7a\u767d\u6807\u7b7e\u8bf4\u660e\u56fe');
    }
    const imageExtra = {
      ...(extra || {}),
      ...imageInfo,
      imageUrl: imageInfo.imageUrl || imageUrl,
      imageFallbackUrl: imageInfo.imageFallbackUrl || imageUrl,
      skuImageUrl: imageInfo.imageUrl || imageUrl,
      skuImageFallbackUrl: imageInfo.imageFallbackUrl || imageUrl,
      isSkuDesignImage: true,
    };
    const imageData = normalizeData({
      ...data,
      skuImageUrl: imageExtra.skuImageUrl,
      skuImageFallbackUrl: imageExtra.skuImageFallbackUrl,
      skuImageSource: 'effectImage',
    });
    cacheProductThumb(imageData, imageExtra);
    if (state.excelExtra && state.excelExtra.excelData && state.excelExtra.excelData.sku === imageData.sku) {
      state.excelExtra = { extra: imageExtra, excelData: imageData };
    }
    return { data: imageData, extra: imageExtra, imageSource: getToyLabelImageSource(imageData, imageExtra) };
  }

  async function getPlmBarcodePreviewImage(sku) {
    const drawer = sku ? getProjectDrawerForSku(sku) : getProjectDrawer();
    if (!drawer) return null;
    await switchDrawerTab(drawer, L.productTab);
    await waitForDrawerText(drawer, '\u6761\u7801\u6587\u4ef6', 1600);
    const label = Array.from(drawer.querySelectorAll('label, .ant-form-item-label, .ant-form-item-no-colon'))
      .filter(isVisibleElement)
      .find((el) => compactText(el.innerText || el.textContent) === '\u6761\u7801\u6587\u4ef6');
    const item = label && label.closest('.ant-form-item');
    if (!item) return null;
    const img = Array.from(item.querySelectorAll('img'))
      .filter(isVisibleElement)
      .find((el) => {
        const src = el.currentSrc || el.src || '';
        return src && !/filePic\/pdf\.png/i.test(src) && !/filePic\/image\.png/i.test(src);
      });
    if (!img) return null;
    return { dataUrl: img.currentSrc || img.src || '', source: 'plm-preview' };
  }

  async function renderToyLabelPrintCanvas(options) {
    const width = Math.round((Number(options.widthCm) || 4) * 300);
    const height = Math.round((Number(options.heightCm) || 3) * 300);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    const productBox = { x: width * 0.18, y: height * 0.11, w: width * 0.64, h: height * 0.39 };
    if (options.productImage && options.productImage.dataUrl) {
      const image = await loadImage(options.productImage.dataUrl);
      drawImageContained(ctx, trimImageWhitespace(image), productBox.x, productBox.y, productBox.w, productBox.h);
    }

    const barcodeBox = { x: width * 0.13, y: height * 0.62, w: width * 0.74, h: height * 0.17 };
    const barcode = options.barcodeImage && options.barcodeImage.canvas
      ? options.barcodeImage.canvas
      : options.barcodeImage && options.barcodeImage.dataUrl
        ? await loadImage(options.barcodeImage.dataUrl)
        : renderCode128Barcode(options.sku, 900, 210);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(barcode, barcodeBox.x, barcodeBox.y, barcodeBox.w, barcodeBox.h);
    ctx.imageSmoothingEnabled = true;

    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '400 ' + Math.round(height * 0.052) + 'px Arial, sans-serif';
    ctx.fillText(options.sku || '', width / 2, height * 0.86);
    return canvas;
  }

  async function renderToyLabelPreviewCanvas(options) {
    const canvas = document.createElement('canvas');
    canvas.width = 3000;
    canvas.height = 3000;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '400 88px Arial, "Microsoft YaHei", "Microsoft YaHei UI", sans-serif';
    ctx.fillText('\u6807\u7b7e', 640, 300);
    ctx.font = '400 90px Arial, "Microsoft YaHei", "Microsoft YaHei UI", sans-serif';
    ctx.fillText('\u89c4\u683c\u5c3a\u5bf8\uff1a  \u5bbd' + trimCm(options.widthCm) + 'X\u9ad8' + trimCm(options.heightCm) + 'CM', 640, 455);

    const labelX = 585;
    const labelY = 958;
    const labelW = 1888;
    const labelH = Math.round(labelW * (Number(options.heightCm) || 3) / (Number(options.widthCm) || 4));
    ctx.strokeStyle = '#9f9f9f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(labelX, labelY, labelW, labelH);
    ctx.drawImage(options.printCanvas, labelX + 2, labelY + 2, labelW - 4, labelH - 4);
    drawDimensionGuide(ctx, labelX, labelY, labelW, labelH, options.widthCm, options.heightCm);
    return canvas;
  }

  function drawDimensionGuide(ctx, x, y, w, h, widthCm, heightCm) {
    ctx.save();
    ctx.strokeStyle = '#ef1f24';
    ctx.fillStyle = '#ef1f24';
    ctx.lineWidth = 4;
    const leftX = x - 70;
    const bottomY = y + h + 62;
    drawLineWithTicks(ctx, leftX, y, leftX, y + h, 28, true);
    drawLineWithTicks(ctx, x, bottomY, x + w, bottomY, 28, false);
    ctx.font = '700 86px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(leftX - 78, y + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(trimCm(heightCm) + 'cm', 0, 0);
    ctx.restore();
    ctx.fillText(trimCm(widthCm) + 'cm', x + w / 2, bottomY + 86);
    ctx.restore();
  }

  function drawLineWithTicks(ctx, x1, y1, x2, y2, tick, vertical) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    if (vertical) {
      ctx.moveTo(x1 - tick / 2, y1);
      ctx.lineTo(x1 + tick / 2, y1);
      ctx.moveTo(x2 - tick / 2, y2);
      ctx.lineTo(x2 + tick / 2, y2);
    } else {
      ctx.moveTo(x1, y1 - tick / 2);
      ctx.lineTo(x1, y1 + tick / 2);
      ctx.moveTo(x2, y2 - tick / 2);
      ctx.lineTo(x2, y2 + tick / 2);
    }
    ctx.stroke();
  }

  function trimCm(value) {
    const num = Number(value);
    return Number.isFinite(num) ? String(Number(num.toFixed(2))).replace(/\.0$/, '') : String(value || '');
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function drawImageContained(ctx, image, x, y, w, h) {
    const iw = image.naturalWidth || image.width || 1;
    const ih = image.naturalHeight || image.height || 1;
    const ratio = Math.min(w / iw, h / ih);
    const dw = iw * ratio;
    const dh = ih * ratio;
    ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }

  function trimImageWhitespace(image) {
    const iw = image.naturalWidth || image.width || 1;
    const ih = image.naturalHeight || image.height || 1;
    const canvas = document.createElement('canvas');
    canvas.width = iw;
    canvas.height = ih;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, iw, ih).data;
    let minX = iw;
    let minY = ih;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < ih; y += 1) {
      for (let x = 0; x < iw; x += 1) {
        const index = (y * iw + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        if (a > 12 && !(r > 245 && g > 245 && b > 245)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX || maxY < minY) return image;
    const pad = Math.round(Math.max(iw, ih) * 0.02);
    const sx = Math.max(0, minX - pad);
    const sy = Math.max(0, minY - pad);
    const sw = Math.min(iw - sx, maxX - minX + 1 + pad * 2);
    const sh = Math.min(ih - sy, maxY - minY + 1 + pad * 2);
    const out = document.createElement('canvas');
    out.width = sw;
    out.height = sh;
    out.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    return out;
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('canvas export failed')), type || 'image/png', quality);
    });
  }

  function renderCode128Barcode(text, width, height) {
    const patterns = [
      '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'
    ];
    const value = String(text || '').replace(/[^\x20-\x7f]/g, '');
    const codes = [104];
    for (let i = 0; i < value.length; i += 1) codes.push(value.charCodeAt(i) - 32);
    let checksum = codes[0];
    for (let i = 1; i < codes.length; i += 1) checksum += codes[i] * i;
    codes.push(checksum % 103, 106);
    const quiet = 10;
    const modules = codes.reduce((sum, code) => sum + patterns[code].split('').reduce((a, n) => a + Number(n), 0), quiet * 2);
    const moduleWidth = width / modules;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#000';
    let x = quiet * moduleWidth;
    codes.forEach((code) => {
      const pattern = patterns[code];
      for (let i = 0; i < pattern.length; i += 1) {
        const w = Number(pattern[i]) * moduleWidth;
        if (i % 2 === 0) ctx.fillRect(Math.round(x), 0, Math.ceil(w), height);
        x += w;
      }
    });
    return canvas;
  }

  function canvasToFlatPsdBlob(canvas, dpi) {
    const width = canvas.width;
    const height = canvas.height;
    const resolution = Math.max(72, Math.round(Number(dpi) || 300));
    const rgba = canvas.getContext('2d').getImageData(0, 0, width, height).data;
    const pixelCount = width * height;
    const resolutionResourceLength = 28;
    const size = 26 + 4 + 4 + resolutionResourceLength + 4 + 2 + pixelCount * 3;
    const bytes = new Uint8Array(size);
    let offset = 0;
    const writeText = (value) => {
      for (let i = 0; i < value.length; i += 1) bytes[offset++] = value.charCodeAt(i);
    };
    const write16 = (value) => {
      bytes[offset++] = (value >> 8) & 255;
      bytes[offset++] = value & 255;
    };
    const write32 = (value) => {
      bytes[offset++] = (value >> 24) & 255;
      bytes[offset++] = (value >> 16) & 255;
      bytes[offset++] = (value >> 8) & 255;
      bytes[offset++] = value & 255;
    };
    writeText('8BPS');
    write16(1);
    offset += 6;
    write16(3);
    write32(height);
    write32(width);
    write16(8);
    write16(3);
    write32(0);
    write32(resolutionResourceLength);
    writeText('8BIM');
    write16(1005);
    write16(0);
    write32(16);
    write32(resolution * 65536);
    write16(1);
    write16(1);
    write32(resolution * 65536);
    write16(1);
    write16(1);
    write32(0);
    write16(0);
    for (let channel = 0; channel < 3; channel += 1) {
      for (let i = 0; i < pixelCount; i += 1) bytes[offset++] = rgba[i * 4 + channel];
    }
    return new Blob([bytes], { type: 'image/vnd.adobe.photoshop' });
  }

  function setCell(sheet, address, value) {
    sheet.getCell(address).value = value;
  }

  function getExcelImageSource(data, extra) {
    const extraImageUrl = extra && extra.isSkuDesignImage && (extra.skuImageUrl || extra.imageUrl || extra.skuImageFallbackUrl || extra.imageFallbackUrl);
    if (extraImageUrl) {
      return { imageUrl: extra.skuImageUrl || extra.imageUrl || extraImageUrl, imageFallbackUrl: extra.skuImageFallbackUrl || extra.imageFallbackUrl || extraImageUrl };
    }
    const skuImageUrl = data && data.skuImageSource === 'effectImage' && (data.skuImageUrl || data.skuImageFallbackUrl);
    if (skuImageUrl) {
      return { imageUrl: data.skuImageUrl || skuImageUrl, imageFallbackUrl: data.skuImageFallbackUrl || data.skuImageUrl || skuImageUrl };
    }
    return { imageUrl: '', imageFallbackUrl: '' };
  }

  async function collectExcelExtraData(sku) {
    const drawer = sku ? getProjectDrawerForSku(sku) : getProjectDrawer();
    const extra = { englishName: '', chineseName: '', ingredients: '', benchmarkLink: '', imageUrl: '', imageFallbackUrl: '', liveData: null };
    if (!drawer) return extra;
    await switchDrawerTab(drawer, L.productTab);
    await waitForDrawerText(drawer, '\u6bdb\u91cd', 1200);
    extra.liveData = extractData(drawer);
    await switchDrawerTab(drawer, '\u8bbe\u8ba1\u8d44\u6599');
    await waitForDesignData(drawer, 4500);
    const designText = getVisibleText(drawer);
    const previewImageInfo = await collectProductImageInfo(drawer, {
      sku,
      includeBenchmark: false,
      allowPreview: true,
      restoreTab: false,
      designTimeout: 4500,
    });
    Object.assign(extra, {
      englishName: extractLineAfter(designText, 'PRODUCT NAME') || '',
      chineseName: extractLineAfter(designText, '\u5546\u54c1\u540d\u79f0') || '',
      ingredients: extractNamedField(designText, '\u6210\u5206') || extractNamedField(designText, '\u6210\u4efd') || '',
      ...previewImageInfo,
    });

    await switchDrawerTab(drawer, '\u9879\u76ee\u4fe1\u606f');
    await waitForDrawerText(drawer, '\u5bf9\u6807\u94fe\u63a5', 1200);
    extra.benchmarkLink = extractBenchmarkLink(getVisibleText(drawer));
    return extra;
  }

  function getCachedSkuImageInfo(sku) {
    const current = state.data && state.data.sku === sku ? state.data : null;
    const data = normalizeData(current || loadData(sku) || {});
    if (data.skuImageSource !== 'effectImage') return { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    const imageUrl = data.skuImageUrl || data.skuImageFallbackUrl || '';
    if (!imageUrl) return { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    return {
      imageUrl,
      imageFallbackUrl: data.skuImageFallbackUrl || data.skuImageUrl || imageUrl,
      skuImageUrl: data.skuImageUrl || imageUrl,
      skuImageFallbackUrl: data.skuImageFallbackUrl || data.skuImageUrl || imageUrl,
      isSkuDesignImage: true,
    };
  }

  async function switchDrawerTab(drawer, label) {
    const button = findTabButton(drawer, label);
    if (button && !isActiveTab(button)) button.click();
  }

  async function waitForDrawerText(drawer, text, timeout) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      if (getVisibleText(drawer).includes(text)) return true;
      await wait(120);
    }
    return false;
  }

  async function waitForDesignData(drawer, timeout) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const text = getVisibleText(drawer);
      const hasName = text.includes('PRODUCT NAME');
      const hasIngredients = Boolean(extractNamedField(text, '\u6210\u5206') || extractNamedField(text, '\u6210\u4efd'));
      if (hasName && hasIngredients) return true;
      scrollDrawerBody(drawer, 0);
      await wait(180);
    }
    return false;
  }

  async function collectProductImageInfo(drawer, options) {
    const opts = options || {};
    const activeText = opts.restoreTab ? getActiveTabText(drawer) : '';
    let imageInfo = { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    await switchDrawerTab(drawer, '\u8bbe\u8ba1\u8d44\u6599');
    await waitForDesignImage(drawer, opts.designTimeout || 1800);
    imageInfo = findDesignImageInfo(drawer);
    if ((!imageInfo.imageUrl && !imageInfo.imageFallbackUrl) && opts.allowPreview) {
      imageInfo = await openPreviewAndGetImageInfo(drawer);
    }
    if (opts.restoreTab && activeText) await switchDrawerTab(drawer, activeText);
    return imageInfo;
  }

  async function waitForDesignImage(drawer, timeout) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const imageInfo = findDesignImageInfo(drawer);
      if (imageInfo.imageUrl || imageInfo.imageFallbackUrl) return true;
      scrollDesignImageCardsIntoView(drawer);
      await wait(120);
    }
    return false;
  }

  function scrollDrawerBody(drawer, top) {
    const body = drawer && (drawer.querySelector('.ant-drawer-body') || drawer.querySelector('.previewFormRoot'));
    if (body && Number.isFinite(body.scrollTop)) body.scrollTop = top;
  }

  function scrollDesignImageCardsIntoView(drawer) {
    if (!drawer) return;
    const card = findDesignPreviewCard(drawer);
    if (card && card.scrollIntoView) card.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function findDesignPreviewCard(root) {
    const item = findStrictEffectImageItem(root || document);
    if (!item) return null;
    return Array.from(item.querySelectorAll('.filePreviewCard, .filePreviewMainBox, .removeOtherContent, .previewMasker, .preview'))
      .filter(isVisibleElement)
      .find((el) => isStrictEffectImageFileContext(getDesignAssetContext(el))) || null;
  }

  function extractLineAfter(text, label) {
    const lines = getCleanLines(text);
    const normalizedLabel = label.replace(/[：:]\s*$/, '');
    const index = lines.findIndex((line) => line.replace(/[：:]\s*$/, '') === normalizedLabel);
    if (index < 0) return '';
    return cleanExcelFieldValue(lines[index + 1]);
  }

  function extractNamedField(text, label) {
    const lines = getCleanLines(text);
    for (let index = 0; index < lines.length - 1; index += 1) {
      if (lines[index] !== label) continue;
      const value = cleanExcelFieldValue(lines[index + 1]);
      if (value && !isLikelyFieldLabel(value)) return value;
    }
    return '';
  }

  function getCleanLines(text) {
    return String(text || '').split('\n').map((line) => compactText(line)).filter(Boolean);
  }

  function cleanExcelFieldValue(value) {
    const text = compactText(value);
    return text === '--' ? '' : text;
  }

  function isLikelyFieldLabel(value) {
    return /^(PRODUCT NAME|\u4e2d\u6587-\u7b80\u4f53|\u82f1\u8bed|\u6210\u4efd\u8868|\u6210\u5206\u529f\u80fd|\u4ea7\u54c1\u5356\u70b9|\u4ea7\u54c1\u4f18\u52bf|\u4ea7\u54c1\u529f\u6548|\u4f7f\u7528\u65b9\u6cd5|\u8b66\u544a\u8bed|\u4ea7\u54c1\u6807\u8bc6|\u5176\u4ed6\u6807\u8bc6)/.test(value);
  }

  function findDesignImageInfo(drawer) {
    const item = findStrictEffectImageItem(drawer);
    if (!item) return { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    const fallback = Array.from(item.querySelectorAll('img.ant-image-img, .ant-image img, img'))
      .filter(isVisibleElement)
      .map((img) => img.currentSrc || img.src || '')
      .find(isStrictDesignImageUrl) || '';
    const original = stripOssResizeParams(fallback);
    return { imageUrl: original, imageFallbackUrl: fallback || original, isSkuDesignImage: Boolean(fallback) };
  }

  function findStrictEffectImageItem(drawer) {
    if (!drawer) return null;
    const root = getDesignContentRoot(drawer);
    if (!root) return null;
    return Array.from(root.querySelectorAll('.ant-form-item'))
      .filter(isVisibleElement)
      .find((item) => isEffectImageFormItem(root, item) && isStrictEffectImageFileContext(item.innerText || item.textContent)) || null;
  }

  function getDesignContentRoot(drawer) {
    const roots = Array.from(drawer.querySelectorAll('.previewFormRoot .tabContent, .tabContent, .previewFormRoot'))
      .filter(isVisibleElement)
      .filter((el) => !el.closest('.searchDropdownPanel, .searchDropdown'));
    return roots.find((el) => /\u6548\u679c\u56fe\u4fe1\u606f[\s\S]*\u56fe\u7247/.test(el.innerText || el.textContent))
      || roots[0]
      || drawer;
  }

  function isEffectImageFormItem(root, item) {
    const label = compactText((item.querySelector('.ant-form-item-label label, .ant-form-item-label') || {}).innerText || (item.querySelector('.ant-form-item-label label, .ant-form-item-label') || {}).textContent || '');
    if (label !== '\u56fe\u7247') return false;
    return getPreviousDesignSection(root, item) === '\u6548\u679c\u56fe\u4fe1\u606f';
  }

  function getPreviousDesignSection(root, item) {
    const itemTop = item.getBoundingClientRect().top;
    const titles = Array.from(root.querySelectorAll('.titleRow, .titleContent, .title'))
      .filter(isVisibleElement)
      .map((el) => ({ top: el.getBoundingClientRect().top, text: compactText(el.innerText || el.textContent) }))
      .filter((entry) => entry.top <= itemTop && /^(\u57fa\u672c\u4fe1\u606f|\u6548\u679c\u56fe\u4fe1\u606f|\u4ea7\u54c1\u6587\u6848|\u8bbe\u8ba1\u6587\u4ef6|\u5907\u6ce8\u4fe1\u606f)$/.test(entry.text))
      .sort((a, b) => a.top - b.top);
    let section = '';
    titles.forEach((entry) => { section = entry.text; });
    return section;
  }

  function isStrictEffectImageFileContext(context) {
    const text = compactText(context);
    if (!text || isExcludedDesignImageContext(text)) return false;
    return /\.(jpg|jpeg|png|webp)\b/i.test(text);
  }

  function isExcludedDesignImageContext(context) {
    return /(\u6807\u7b7e\u5c3a\u5bf8\u56fe|\u4ea7\u54c1\u6587\u6848|\u4ea7\u54c1\u6b63\u9762\u6587\u6848|\u6587\u6848|\u4f01\u4e1a\u5fae\u4fe1|\u622a\u56fe|\.pdf\b|\.docx?\b|\.xlsx?\b)/i.test(compactText(context));
  }

  async function openPreviewAndGetImageInfo(drawer) {
    const beforeUrls = getVisibleOssImageUrls(document);
    const preview = findDesignPreviewCard(drawer);
    if (!preview) return { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    preview.click();
    const images = await waitForPreviewImageUrls(beforeUrls, 1600);
    closeImagePreview();
    const fallback = images[0] || '';
    return { imageUrl: stripOssResizeParams(fallback), imageFallbackUrl: fallback, isSkuDesignImage: Boolean(fallback) };
  }

  async function waitForPreviewImageUrls(beforeUrls, timeout) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const images = getVisibleOssImageUrls(document)
        .filter((src) => !beforeUrls.includes(src))
        .filter((src) => !/filePic\//i.test(src));
      if (images.length) return images;
      await wait(160);
    }
    return [];
  }

  function getVisibleOssImageUrls(root) {
    return Array.from((root || document).querySelectorAll('.ant-image-preview-img, .ant-image-preview-wrap img, img'))
      .filter(isVisibleElement)
      .map((img) => img.currentSrc || img.src || '')
      .filter((src) => /^https?:\/\/oss-pro\.plm\.westmonth\.cn\//.test(src));
  }

  function isStrictDesignImageUrl(src) {
    return /^https?:\/\/oss-pro\.plm\.westmonth\.cn\//.test(String(src || '')) && !/\/filePic\//i.test(src);
  }

  function closeImagePreview() {
    const close = document.querySelector('.ant-image-preview-close');
    if (close) close.click();
  }

  function isProductDesignImage(img) {
    const context = getDesignAssetContext(img);
    if (isExcludedDesignImageContext(context)) return false;
    return isStrictEffectImageFileContext(context);
  }

  function isProductDesignPreview(el) {
    const context = getDesignAssetContext(el);
    return !isExcludedDesignImageContext(context);
  }

  function getDesignAssetContext(el) {
    const preferred = el.closest('.filePreviewCard, .filePreviewMainBox, .removeOtherContent');
    if (preferred) return compactText(preferred.innerText || preferred.textContent || '');
    let node = el.parentElement;
    while (node && node !== document.body) {
      const text = compactText(node.innerText || node.textContent || '');
      if (text) return text;
      node = node.parentElement;
    }
    return '';
  }

  function stripOssResizeParams(url) {
    return String(url || '').replace(/\?x-oss-process=.*$/i, '');
  }

  function extractBenchmarkLink(text) {
    const lines = getCleanLines(text);
    const index = lines.findIndex((line) => /\u5bf9\u6807\u94fe\u63a5/.test(line));
    const nearby = index >= 0 ? lines.slice(index + 1, index + 5).join(' ') : text;
    return ((nearby.match(/https?:\/\/\S+/) || String(text || '').match(/https?:\/\/\S+/)) || [''])[0];
  }

  function formatExcelDim(nums, fallbackParts) {
    const parts = (Array.isArray(nums) && nums.length >= 3 ? nums.slice(0, 3).map(trimNumber) : fallbackParts.map(extractCmValue))
      .filter((part) => part !== '');
    return parts.length >= 2 ? parts.join('*') + 'CM' : '';
  }

  function formatExcelDimFromParts(parts) {
    const values = (parts || []).map(extractCmValue).filter((part) => part !== '');
    return values.length >= 2 ? values.join('*') + 'CM' : '';
  }

  function extractCmValue(value) {
    const match = String(value || '').match(/\d+(?:\.\d+)?/);
    return match ? trimNumber(Number(match[0])) : '';
  }

  function normalizeExcelUnit(value) {
    const text = compactText(value).replace(/\s+/g, '');
    if (!text || text === L.unknown) return '';
    return text.replace(/g\b/i, 'G').replace(/ml\b/i, 'ML');
  }

  function formatIngredientsForExcel(value) {
    return String(value || '').replace(/\s*(\u975e\u6d3b\u6027\u6210\u5206[:\uff1a])\s*/g, '\n$1');
  }

  function normalizeExcelNumberOrText(value) {
    const text = compactText(value);
    if (!text) return '';
    const num = Number(text);
    return Number.isFinite(num) ? num : text;
  }

  function normalizePackQty(value) {
    const text = compactText(value).replace(/\s+/g, '');
    if (!text) return '';
    return /pcs$/i.test(text) ? text.toUpperCase() : text + 'PCS';
  }

  async function fillRecommendedPackQty(data) {
    if (state.excelPackQty) return false;
    const boxKey = buildPackBoxKey(data);
    if (!boxKey) return false;
    const recommendation = await fetchPackRecommendation(boxKey).catch(() => null);
    const count = recommendation && recommendation.packCount ? String(recommendation.packCount) : '';
    if (!count) return false;
    state.excelPackQty = count;
    state.excelStatus = L.excelPackRecommended + ': ' + count;
    return true;
  }

  async function fillRecommendedPurchasePrice(data, extra) {
    const savedPrice = normalizeLedgerPurchasePrice(data && data.purchasePrice);
    if (savedPrice) {
      state.excelPurchasePrice = savedPrice;
      return false;
    }
    const current = String(state.excelPurchasePrice || '').trim();
    if (current && current !== '6') return false;
    const productType = getProductTypeForInsight(data, extra);
    const cloudRecommendation = await fetchInsightRecommendation(data, productType).catch((error) => {
      addLog('warn', '\u4ef7\u683c\u63a8\u8350\u83b7\u53d6\u5931\u8d25', formatErrorMessage(error));
      return null;
    });
    const recommendedType = cloudRecommendation && cloudRecommendation.recommendedProductType && cloudRecommendation.recommendedProductType !== productType ? cloudRecommendation.recommendedProductType : '';
    const effectiveProductType = recommendedType || (cloudRecommendation && cloudRecommendation.effectiveProductType) || productType;
    if (recommendedType) {
      addLog('success', '\u5df2\u6839\u636e\u5386\u53f2\u5546\u54c1\u540d\u63a8\u65ad\u7c7b\u578b', (data && data.sku || '') + ' ' + productType + ' -> ' + recommendedType);
    }
    const recommendation = cloudRecommendation && cloudRecommendation.recommendedPrice ? cloudRecommendation : getLocalPriceRecommendation(data, effectiveProductType);
    const price = recommendation && recommendation.recommendedPrice ? String(recommendation.recommendedPrice) : '';
    if (!price) return false;
    const reason = recommendation.recommendationReason || buildLocalRecommendationReason(recommendation, effectiveProductType);
    const confidenceText = recommendation.priceConfidence || recommendation.recommendationConfidence || '';
    const priceStatsText = formatRecommendationPriceStats(recommendation.priceStats);
    state.excelPurchasePrice = price;
    state.excelStatus = '\u63a8\u8350\u4ef7\u683c: ' + price + (effectiveProductType ? ' / ' + effectiveProductType : '') + (confidenceText ? ' / \u7f6e\u4fe1\u5ea6' + confidenceText : '') + (recommendation.source ? ' / ' + recommendation.source : '') + (reason ? ' / ' + reason : '');
    addLog('success', '\u5df2\u667a\u80fd\u8865\u5168\u91c7\u8d2d\u4ef7\u683c', (data && data.sku || '') + ' ' + effectiveProductType + ' ' + price + (confidenceText ? ' / \u7f6e\u4fe1\u5ea6' + confidenceText : '') + (priceStatsText ? ' / ' + priceStatsText : '') + (reason ? ' / ' + reason : ''));
    syncInsightEvent('recommendation', {
      sku: data && data.sku || '',
      brand: data && data.brand || '',
      name: data && data.name || '',
      productType: effectiveProductType || productType || '',
      price,
      recommendedPrice: price,
      source: recommendation.source || 'recommendation',
      reason,
      recommendationReason: reason,
      productTypeSource: recommendation.productTypeSource || '',
      productTypeScore: recommendation.productTypeScore || '',
      typeSampleCount: recommendation.typeSampleCount || '',
      recommendedProductType: recommendation.recommendedProductType || '',
      effectiveProductType,
      priceConfidence: confidenceText,
      recommendationConfidence: confidenceText,
      priceStats: recommendation.priceStats || null,
    });
    return true;
  }

  function formatRecommendationPriceStats(stats) {
    if (!stats || !stats.count) return '';
    return '\u6837\u672c' + stats.count + ' / \u4e2d\u4f4d' + stats.median + ' / \u5747\u4ef7' + stats.avg + ' / \u533a\u95f4' + stats.min + '-' + stats.max;
  }

  function buildLocalRecommendationReason(recommendation, productType) {
    if (!recommendation || !recommendation.recommendedPrice) return '';
    if (recommendation.source === 'local-same-sku') return '\u672c\u5730\u540c SKU \u5386\u53f2\u4ef7';
    if (recommendation.source === 'local-same-type') return '\u672c\u5730\u540c\u7c7b\u578b\u5386\u53f2\u4ef7' + (productType ? '\uff1a' + productType : '');
    if (recommendation.source === 'local-name') return '\u672c\u5730\u76f8\u4f3c\u5546\u54c1\u540d\u5386\u53f2\u4ef7';
    return '';
  }

  function getLocalPriceRecommendation(data, productType) {
    const history = state.insights && Array.isArray(state.insights.priceHistory) ? state.insights.priceHistory : [];
    if (!history.length || !data) return null;
    const sku = String(data.sku || '');
    const name = String(data.name || '').trim();
    const valid = history.map((item) => ({
      ...item,
      numericPrice: Number(String(item.price || '').replace(/[^0-9.]/g, '')),
    })).filter((item) => item.numericPrice > 0);
    const sameSku = valid.find((item) => sku && item.sku === sku);
    if (sameSku) return { recommendedPrice: sameSku.numericPrice, source: 'local-same-sku' };
    const sameType = valid.find((item) => productType && item.productType === productType);
    if (sameType) return { recommendedPrice: sameType.numericPrice, source: 'local-same-type' };
    const sameName = valid.find((item) => name && String(item.name || '').includes(name.slice(0, 8)));
    if (sameName) return { recommendedPrice: sameName.numericPrice, source: 'local-name' };
    return null;
  }

  function getReturnDateText(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return '\uff08' + date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate() + '\uff09';
  }

  function buildExcelKeyword(data, extra) {
    if (state.settings.excelKeywordMode === 'brandName') {
      return [data.brand, data.name || (extra && extra.chineseName)].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    }
    return (extra && extra.englishName) || '';
  }

  function buildExcelFileName(data, extra) {
    const parts = [data.brand, data.name || (extra && extra.chineseName), data.sku].map(cleanFileNamePart).filter(Boolean);
    const base = parts.join(' ').replace(/\s+/g, ' ').trim();
    return sanitizeExcelFileName((base || data.sku || 'PLM\u4ea7\u54c1\u4fe1\u606f') + '.xlsx');
  }

  function cleanFileNamePart(value) {
    return String(value || '').replace(/[\\/:*?"<>|_]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function sanitizeExcelFileName(filename) {
    const value = String(filename || '').replace(/\.xlsx$/i, '').replace(/[\\/:*?"<>|_]+/g, ' ').replace(/\s+/g, ' ').trim();
    return (value || 'PLM\u4ea7\u54c1\u4fe1\u606f') + '.xlsx';
  }

  function toBrowserDownloadFileName(filename) {
    return sanitizeDownloadFileName(filename).replace(/ /g, '\u00a0');
  }

  function sanitizeDownloadFileName(filename) {
    const raw = String(filename || '').trim();
    const match = raw.match(/(\.[a-z0-9]{2,8})$/i);
    const ext = match ? match[1] : '';
    const stem = (ext ? raw.slice(0, -ext.length) : raw).replace(/[\\/:*?"<>|_]+/g, ' ').replace(/\s+/g, ' ').trim();
    return (stem || 'PLM\u6587\u4ef6') + ext;
  }

  async function chooseExcelSaveTarget(filename) {
    if (state.settings.excelDownloadMode === 'direct') return { type: 'download', direct: true };
    const picker = getSaveFilePicker();
    if (!picker) return { type: 'download' };
    try {
      const handle = await picker({
        suggestedName: sanitizeExcelFileName(filename),
        types: [{
          description: 'Excel Workbook',
          accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
        }],
      });
      return { type: 'fileSystem', handle };
    } catch (error) {
      if (error && error.name === 'AbortError') return null;
      console.warn('PLM floating helper save picker failed, fallback to download:', error);
      showToast(L.excelSavePickerUnavailable);
      return { type: 'download' };
    }
  }

  function getSaveFilePicker() {
    if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.showSaveFilePicker === 'function') {
      return (options) => unsafeWindow.showSaveFilePicker(options);
    }
    if (typeof window.showSaveFilePicker === 'function') return (options) => window.showSaveFilePicker(options);
    return null;
  }

  async function saveExcelBlob(blob, filename, target) {
    if (target && target.type === 'fileSystem' && target.handle) {
      const writable = await target.handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    }
    if (!target || !target.direct) showToast(L.excelSavePickerUnavailable);
    downloadBlob(blob, filename);
  }

  function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  function fetchImageForExcel(url, fallbackUrl) {
    return new Promise((resolve, reject) => {
      const done = async (arrayBuffer, contentType) => {
        const extension = /png/i.test(contentType || url) ? 'png' : 'jpeg';
        const dataUrl = 'data:image/' + extension + ';base64,' + arrayBufferToBase64(arrayBuffer);
        const size = await getImageSize(dataUrl).catch(() => ({ width: 118, height: 64 }));
        resolve({ dataUrl, extension, width: size.width, height: size.height });
      };
      const request = (targetUrl, allowFallback) => {
        if (typeof GM_xmlhttpRequest === 'function') {
          GM_xmlhttpRequest({
            method: 'GET',
            url: targetUrl,
            responseType: 'arraybuffer',
            timeout: 8000,
            onload: (res) => {
              if (res.status >= 200 && res.status < 300) done(res.response, res.responseHeaders || targetUrl);
              else if (allowFallback && fallbackUrl && fallbackUrl !== targetUrl) request(fallbackUrl, false);
              else reject(new Error('image status ' + res.status));
            },
            onerror: () => allowFallback && fallbackUrl && fallbackUrl !== targetUrl ? request(fallbackUrl, false) : reject(new Error('image request failed')),
            ontimeout: () => allowFallback && fallbackUrl && fallbackUrl !== targetUrl ? request(fallbackUrl, false) : reject(new Error('image request timeout')),
          });
          return;
        }
        fetchWithTimeout(targetUrl, 8000).then((res) => {
          if (!res.ok) throw new Error('image status ' + res.status);
          return res.arrayBuffer().then((buffer) => done(buffer, res.headers.get('content-type') || targetUrl));
        }).catch((error) => {
          if (allowFallback && fallbackUrl && fallbackUrl !== targetUrl) request(fallbackUrl, false);
          else reject(error);
        });
      };
      request(url, true);
    });
  }

  function fetchWithTimeout(url, timeout) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
  }

  function getImageSize(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height });
      image.onerror = reject;
      image.src = dataUrl;
    });
  }

  function getExcelImageAnchor(imageInfo) {
    const boxWidth = 170;
    const boxHeight = 124;
    const width = Number(imageInfo.width) || boxWidth;
    const height = Number(imageInfo.height) || boxHeight;
    const ratio = Math.min(boxWidth / width, boxHeight / height);
    const fitWidth = Math.max(1, Math.round(width * ratio));
    const fitHeight = Math.max(1, Math.round(height * ratio));
    return {
      tl: { col: 2.12, row: 3.06 },
      ext: { width: fitWidth, height: fitHeight },
      editAs: 'oneCell',
    };
  }

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
  }

  function downloadBlob(blob, filename) {
    const safeName = sanitizeDownloadFileName(filename);
    const browserName = toBrowserDownloadFileName(safeName);
    const panel = ensurePanel();
    state.ignoreOutsideClickUntil = Date.now() + 1500;
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = URL.createObjectURL(blob);
    link.download = browserName;
    panel.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
  }

  async function createStoredZipBlob(files, onProgress) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const now = new Date();
    const dosTime = ((now.getHours() & 31) << 11) | ((now.getMinutes() & 63) << 5) | ((Math.floor(now.getSeconds() / 2)) & 31);
    const dosDate = (((Math.max(1980, now.getFullYear()) - 1980) & 127) << 9) | (((now.getMonth() + 1) & 15) << 5) | (now.getDate() & 31);
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const nameBytes = encoder.encode(String(file.path || file.filename || ('file-' + index)));
      const data = new Uint8Array(await file.blob.arrayBuffer());
      if (data.byteLength > 0xffffffff || offset > 0xffffffff) throw new Error('ZIP file is too large');
      const crc = crc32Bytes(data);
      const local = new Uint8Array(30);
      const lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true);
      lv.setUint16(8, 0, true);
      lv.setUint16(10, dosTime, true);
      lv.setUint16(12, dosDate, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, data.byteLength, true);
      lv.setUint32(22, data.byteLength, true);
      lv.setUint16(26, nameBytes.byteLength, true);
      const central = new Uint8Array(46);
      const cv = new DataView(central.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, dosTime, true);
      cv.setUint16(14, dosDate, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, data.byteLength, true);
      cv.setUint32(24, data.byteLength, true);
      cv.setUint16(28, nameBytes.byteLength, true);
      cv.setUint32(42, offset, true);
      localParts.push(local, nameBytes, data);
      centralParts.push(central, nameBytes);
      offset += local.byteLength + nameBytes.byteLength + data.byteLength;
      if (typeof onProgress === 'function') onProgress(index + 1, files.length);
      await wait(0);
    }
    const centralOffset = offset;
    const centralSize = centralParts.reduce((sum, part) => sum + part.byteLength, 0);
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, centralOffset, true);
    return new Blob(localParts.concat(centralParts, end), { type: 'application/zip' });
  }

  function crc32Bytes(bytes) {
    if (!crc32Bytes.table) {
      crc32Bytes.table = Array.from({ length: 256 }, (_, value) => {
        let entry = value;
        for (let bit = 0; bit < 8; bit += 1) entry = (entry >>> 1) ^ (0xedb88320 & -(entry & 1));
        return entry >>> 0;
      });
    }
    let crc = 0xffffffff;
    for (let index = 0; index < bytes.length; index += 1) crc = (crc >>> 8) ^ crc32Bytes.table[(crc ^ bytes[index]) & 0xff];
    return (crc ^ 0xffffffff) >>> 0;
  }

  async function downloadToyLabelBatchArchive(options) {
    const opts = options || {};
    const memoryFiles = Array.isArray(state.toyLabelBatchFiles) ? state.toyLabelBatchFiles.splice(0) : [];
    const manifest = loadToyLabelExportManifest();
    const persistedFiles = [];
    for (const entry of manifest.files) {
      const blob = await getUploadFile(entry.key).catch((error) => {
        console.warn('PLM floating helper toy label staged file read failed:', error);
        return null;
      });
      if (blob) persistedFiles.push({ sku: entry.sku, filename: entry.filename, blob });
    }
    const files = [];
    const seen = new Set();
    persistedFiles.concat(memoryFiles).forEach((file) => {
      const key = String(file && file.sku || '') + '\u0000' + String(file && file.filename || '');
      if (!file || !file.blob || !file.filename || seen.has(key)) return;
      seen.add(key);
      files.push(file);
    });
    if (!files.length) {
      addLog('warn', '批量玩具标签：没有可打包的 PSD 和图片', '');
      return false;
    }
    const nativeZipFiles = files.map((file) => ({
      ...file,
      path: (cleanFileNamePart(file.sku || '\u73a9\u5177\u6807\u7b7e') || '\u73a9\u5177\u6807\u7b7e') + '/' + sanitizeDownloadFileName(file.filename),
    }));
    addLog('info', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e\uff1a\u6b63\u5728\u5199\u5165 ZIP', nativeZipFiles.length + '\u4e2a\u6587\u4ef6');
    const nativeBlob = await createStoredZipBlob(nativeZipFiles, (done, total) => {
      state.excelStatus = '\u6b63\u5728\u6253\u5305 ZIP ' + done + '/' + total;
    });
    downloadBlob(nativeBlob, '\u73a9\u5177\u6807\u7b7e\u6279\u91cf\u5305_' + new Date().toISOString().slice(0, 10) + '.zip');
    if (opts.keepStagedFiles) {
      manifest.downloaded = true;
      saveToyLabelExportManifest(manifest);
    } else await clearToyLabelExportManifest(manifest);
    addLog('success', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e PSD \u548c\u56fe\u7247\u5df2\u6253\u5305', nativeZipFiles.length + '\u4e2a\u6587\u4ef6');
    showToast('\u73a9\u5177\u6807\u7b7e PSD \u548c\u56fe\u7247 ZIP \u5df2\u4e0b\u8f7d');
    return true;

    const Zip = (typeof JSZip !== 'undefined' && JSZip) || (typeof unsafeWindow !== 'undefined' && unsafeWindow.JSZip);
    if (!Zip) {
      files.forEach((file) => downloadBlob(file.blob, file.filename));
      if (opts.keepStagedFiles) {
        manifest.downloaded = true;
        saveToyLabelExportManifest(manifest);
      } else await clearToyLabelExportManifest(manifest);
      showToast('未加载压缩组件，已逐个下载玩具标签文件');
      return false;
    }
    const zip = new Zip();
    let validCount = 0;
    files.forEach((file) => {
      if (!file || !file.blob || !file.filename) return;
      const folder = cleanFileNamePart(file.sku || '玩具标签') || '玩具标签';
      zip.file(folder + '/' + sanitizeDownloadFileName(file.filename), file.blob);
      validCount += 1;
    });
    if (!validCount) {
      addLog('warn', '批量玩具标签：文件内容不完整', '');
      return false;
    }
    addLog('info', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e\uff1a\u6b63\u5728\u7ec4\u88c5 ZIP', validCount + '\u4e2a\u6587\u4ef6');
    const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE', streamFiles: true }, (metadata) => {
      const percent = Math.floor(Number(metadata && metadata.percent) || 0);
      if (percent > 0 && percent % 25 === 0) state.excelStatus = '\u6b63\u5728\u6253\u5305 ZIP ' + percent + '%';
    });
    downloadBlob(blob, '玩具标签批量包_' + new Date().toISOString().slice(0, 10) + '.zip');
    if (opts.keepStagedFiles) {
      manifest.downloaded = true;
      saveToyLabelExportManifest(manifest);
    } else await clearToyLabelExportManifest(manifest);
    addLog('success', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e PSD \u548c\u56fe\u7247\u5df2\u6253\u5305', validCount + '\u4e2a\u6587\u4ef6');
    showToast('\u73a9\u5177\u6807\u7b7e PSD \u548c\u56fe\u7247 ZIP \u5df2\u4e0b\u8f7d');
    return true;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function parseSearchTokens(query) {
    const source = String(query || '');
    const skuTokens = source.match(/SKU\d+/ig) || [];
    if (skuTokens.length > 1) {
      return Array.from(new Set(skuTokens.map((token) => token.toLowerCase())));
    }
    return Array.from(new Set(source.split(/[\s,，;；、|/\\]+/).map((token) => token.trim().toLowerCase()).filter(Boolean)));
  }

  function normalizeSearchInput(value) {
    return String(value || '').replace(/[\r\n,，;；、|/\\]+/g, ' ').replace(/\s+/g, ' ').trimStart();
  }

  function matchesSearchItem(item, tokens) {
    const queryTokens = Array.isArray(tokens) ? tokens : parseSearchTokens(tokens);
    if (!queryTokens.length) return true;
    if ([item.sku, item.brand, item.name, item.packageCode, item.printCode].some((value) => queryTokens.some((token) => String(value || '').toLowerCase().includes(token)))) return true;
    const data = loadData(item.sku);
    if (!data) return false;
    return [data.brand, data.name, data.packageCode, data.printCode].some((value) => queryTokens.some((token) => String(value || '').toLowerCase().includes(token)));
  }

  function getSearchMatches(tokens) {
    const queryTokens = Array.isArray(tokens) ? tokens : parseSearchTokens(tokens);
    const sortedItems = getSortedIndex();
    return queryTokens.length ? sortedItems.filter((item) => matchesSearchItem(item, queryTokens)) : sortedItems;
  }

  function exportCache() {
    const payload = buildCachePayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plm-floating-helper-cache-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
  }

  function exportInsights() {
    const payload = buildInsightsPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plm-floating-helper-insights-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
    addLog('success', '\u5df2\u5bfc\u51fa\u6570\u636e\u6d1e\u5bdf', payload.exportedAt);
  }

  function buildInsightsPayload() {
    return {
      plugin: L.title,
      version: SCRIPT_VERSION,
      exportedAt: new Date().toLocaleString(),
      insights: state.insights || emptyInsights(),
      promptHint: '\u8bf7\u6574\u7406\u4ef7\u683c\u5386\u53f2\u3001\u5546\u54c1\u7c7b\u578b\u89c4\u5f8b\u548c\u5b57\u6bb5\u7f3a\u5931\u539f\u56e0\uff0c\u8f93\u51fa\u9002\u5408\u5bfc\u5165\u98de\u4e66\u8868\u683c\u7684\u7ed3\u6784\u5316\u8868\u683c\u3002',
    };
  }

  async function refreshCloudInsightSummary() {
    state.insightCloudStatus = '\u6b63\u5728\u62c9\u53d6\u4e91\u7aef\u6458\u8981...';
    renderShell();
    try {
      const summary = await fetchInsightSummary();
      const totalText = formatCloudInsightTotals(summary && summary.totals);
      const typeCount = summary && Array.isArray(summary.productTypes) ? summary.productTypes.length : 0;
      state.insightCloudStatus = '\u4e91\u7aef\uff1a' + totalText + '\uff0c\u7c7b\u578b ' + typeCount + '\u7c7b';
      addLog('success', '\u4e91\u7aef\u6d1e\u5bdf\u6458\u8981\u5df2\u66f4\u65b0', state.insightCloudStatus);
    } catch (error) {
      state.insightCloudStatus = '\u4e91\u7aef\u6458\u8981\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u4e91\u7aef\u6d1e\u5bdf\u6458\u8981\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  async function checkCloudInsightReadiness() {
    state.insightCloudStatus = '\u6b63\u5728\u4f53\u68c0\u4e91\u7aef\u6d1e\u5bdf\u94fe\u8def...';
    renderShell();
    try {
      const response = await fetchInsightReadiness();
      state.insightReadiness = response || null;
      const checks = Array.isArray(response && response.checks) ? response.checks : [];
      const passed = checks.filter((item) => item.ok).length;
      const failed = checks.length - passed;
      const blockers = (response && response.blockers || []).map((item) => item.label + '\uff1a' + item.detail).join(' / ');
      state.insightCloudStatus = (response && response.ready ? '\u6d1e\u5bdf\u94fe\u8def\u5df2\u5c31\u7eea' : '\u6d1e\u5bdf\u94fe\u8def\u672a\u5c31\u7eea') +
        '\uff1a' + passed + '/' + checks.length + '\u9879\u901a\u8fc7' + (failed ? '\uff0c\u7f3a\u53e3 ' + blockers : '');
      copyText(formatInsightReadinessReport(response));
      addLog(response && response.ready ? 'success' : 'warn', '\u4e91\u7aef\u6d1e\u5bdf\u4f53\u68c0', state.insightCloudStatus);
      showToast(state.insightCloudStatus + '\uff0c\u62a5\u544a\u5df2\u590d\u5236');
    } catch (error) {
      state.insightCloudStatus = '\u4e91\u7aef\u6d1e\u5bdf\u4f53\u68c0\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u4e91\u7aef\u6d1e\u5bdf\u4f53\u68c0\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  function formatInsightReadinessReport(response) {
    const checks = Array.isArray(response && response.checks) ? response.checks : [];
    const blockers = Array.isArray(response && response.blockers) ? response.blockers : [];
    const totals = response && response.totals ? response.totals : {};
    const lines = [
      'PLM \u4e91\u7aef\u6d1e\u5bdf\u4f53\u68c0',
      '\u751f\u6210\u65f6\u95f4\uff1a' + new Date().toLocaleString(),
      '\u603b\u72b6\u6001\uff1a' + (response && response.ready ? '\u5df2\u5c31\u7eea' : '\u672a\u5c31\u7eea'),
      '\u4e8b\u4ef6\u7edf\u8ba1\uff1a' + Object.keys(totals).map((key) => key + '=' + totals[key]).join(' / '),
      '',
      '\u68c0\u67e5\u9879',
    ];
    checks.forEach((item) => {
      lines.push((item.ok ? '\u901a\u8fc7' : '\u672a\u901a\u8fc7') + '\t' + (item.label || item.key || '') + '\t' + (item.detail || ''));
    });
    lines.push('', '\u963b\u585e\u9879');
    if (blockers.length) {
      blockers.forEach((item) => lines.push((item.label || item.key || '') + '\t' + (item.detail || '')));
    } else {
      lines.push('\u65e0');
    }
    return lines.join('\n');
  }

  async function copyCloudInsightReport() {
    state.insightCloudStatus = '\u6b63\u5728\u751f\u6210\u4e91\u7aef\u603b\u7ed3...';
    renderShell();
    try {
      const response = await fetchInsightReport();
      const report = response && response.report ? response.report : '';
      if (!report) throw new Error('empty report');
      state.insightCloudReport = report;
      state.insightCloudStatus = '\u4e91\u7aef\u603b\u7ed3\u5df2\u590d\u5236\uff0c\u53ef\u76f4\u63a5\u8d34\u5230 AI \u6216\u98de\u4e66\u8868\u683c';
      copyText(report);
      addLog('success', '\u5df2\u590d\u5236\u4e91\u7aef\u6d1e\u5bdf\u603b\u7ed3');
      showToast(L.copied);
    } catch (error) {
      state.insightCloudStatus = '\u4e91\u7aef\u603b\u7ed3\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u4e91\u7aef\u6d1e\u5bdf\u603b\u7ed3\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  async function syncCloudInsightToFeishu() {
    state.insightCloudStatus = '\u6b63\u5728\u540c\u6b65\u5230\u98de\u4e66\uff08\u542b AI \u6574\u7406\uff09...';
    renderShell();
    try {
      const response = await syncInsightFeishu();
      if (!response || response.ok === false) throw buildCloudError(response || { error: 'feishu sync failed' }, 200);
      state.insightCloudStatus = '\u98de\u4e66\u540c\u6b65\u5b8c\u6210\uff1a' + (response.inserted || 0) + '\u6761' + (response.skipped ? '\uff0c\u8df3\u8fc7\u5df2\u540c\u6b65 ' + response.skipped + '\u6761' : '') + formatFeishuPreviewSuffix(response.preview);
      addLog('success', '\u98de\u4e66\u540c\u6b65\u5b8c\u6210', String(response.inserted || 0) + '\u6761' + (response.skipped ? ' / skipped ' + response.skipped : ''));
      showToast(state.insightCloudStatus);
    } catch (error) {
      if (isRecoverableFeishuSyncError(error)) {
        addLog('warn', '\u98de\u4e66\u76f4\u5199\u4e0d\u53ef\u7528\uff0c\u5df2\u56de\u9000\u590d\u5236\u8868\u683c', formatFeishuSyncErrorDetail(error));
        await copyCloudInsightFeishuTable({ fallbackFromSync: true, reason: formatFeishuSyncErrorDetail(error) });
      } else {
        state.insightCloudStatus = '\u98de\u4e66\u540c\u6b65\u5931\u8d25\uff1a' + formatErrorMessage(error);
        addLog('warn', '\u98de\u4e66\u540c\u6b65\u5931\u8d25', formatErrorMessage(error));
        showToast(state.insightCloudStatus);
      }
    }
    renderShell();
  }

  async function checkCloudInsightFeishuStatus() {
    state.insightCloudStatus = '\u6b63\u5728\u68c0\u67e5\u98de\u4e66\u914d\u7f6e...';
    renderShell();
    try {
      const response = await fetchInsightFeishuStatus();
      if (response && response.configured) {
        const preview = await fetchInsightFeishuPreview().catch(() => null);
        state.insightCloudStatus = '\u98de\u4e66\u914d\u7f6e\u5df2\u5b8c\u6574\uff0c\u5b57\u6bb5\uff1a' + (response.requiredFields || []).join(' / ') + formatFeishuPreviewSuffix(preview);
        addLog('success', '\u98de\u4e66\u914d\u7f6e\u68c0\u67e5\u901a\u8fc7');
      } else {
        const preview = await fetchInsightFeishuPreview().catch(() => null);
        state.insightCloudStatus = formatFeishuSetupStatus(response);
        if (preview) state.insightCloudStatus += '\n\n\u5f85\u5199\u5165\u9884\u89c8\uff1a' + formatFeishuPreviewText(preview);
        copyText(state.insightCloudStatus);
        addLog('warn', '\u98de\u4e66\u914d\u7f6e\u4e0d\u5b8c\u6574', state.insightCloudStatus);
        showToast('\u98de\u4e66\u914d\u7f6e\u547d\u4ee4\u5df2\u590d\u5236');
      }
      showToast(state.insightCloudStatus);
    } catch (error) {
      state.insightCloudStatus = '\u98de\u4e66\u914d\u7f6e\u68c0\u67e5\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u98de\u4e66\u914d\u7f6e\u68c0\u67e5\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  async function copyCloudInsightFeishuSetup() {
    state.insightCloudStatus = '\u6b63\u5728\u751f\u6210\u98de\u4e66\u5efa\u8868\u914d\u7f6e...';
    renderShell();
    try {
      const response = await fetchInsightFeishuStatus();
      const text = formatFeishuSetupStatus(response);
      if (!text) throw new Error('empty feishu setup');
      state.insightCloudStatus = '\u98de\u4e66\u5efa\u8868\u5b57\u6bb5\u548c Worker secrets \u547d\u4ee4\u5df2\u590d\u5236';
      copyText(text);
      addLog('success', '\u5df2\u590d\u5236\u98de\u4e66\u914d\u7f6e\u6307\u5357');
      showToast(L.copied);
    } catch (error) {
      state.insightCloudStatus = '\u98de\u4e66\u914d\u7f6e\u751f\u6210\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u98de\u4e66\u914d\u7f6e\u751f\u6210\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  function formatFeishuSetupStatus(response) {
    if (response && response.setupGuide) return response.setupGuide;
    const missing = (response && response.missing || []).join(' / ') || '\u672a\u77e5';
    const tableMissing = (response && response.tableMissingFields || []).join(' / ');
    const checkError = response && response.checkError ? String(response.checkError) : '';
    const fields = (response && response.requiredFields || []).join(' / ');
    const schema = Array.isArray(response && response.requiredFieldSchema)
      ? response.requiredFieldSchema.map((field) => [field.name || '', field.type || '', field.note || ''].join('\t')).join('\n')
      : '';
    const commands = (response && response.setupCommands || []).join('\n');
    return [
      '\u98de\u4e66\u7f3a\u914d\u7f6e\uff1a' + missing,
      tableMissing ? '\u98de\u4e66\u8868\u7f3a\u5b57\u6bb5\uff1a' + tableMissing : '',
      checkError ? '\u98de\u4e66\u68c0\u67e5\u9519\u8bef\uff1a' + checkError : '',
      fields ? '\u9700\u8981\u5efa\u8868\u5b57\u6bb5\uff1a' + fields : '',
      schema ? '\u5b57\u6bb5\u6a21\u677f\uff1a\n\u5b57\u6bb5\u540d\t\u5efa\u8bae\u7c7b\u578b\t\u7528\u9014\n' + schema : '',
      commands ? '\u914d\u7f6e\u547d\u4ee4\uff1a\n' + commands : '',
    ].filter(Boolean).join('\n');
  }

  function formatFeishuPreviewSuffix(preview) {
    const text = formatFeishuPreviewText(preview);
    return text ? '\uff1b' + text : '';
  }

  function formatFeishuPreviewText(preview) {
    if (!preview || typeof preview !== 'object') return '';
    const total = Number(preview.totalRecords || 0);
    const unsynced = Number(preview.unsyncedRecords || 0);
    const skipped = Number(preview.skippedRecords || 0);
    const types = preview.unsyncedRecordTypes || preview.recordTypes || {};
    const typeText = Object.keys(types).map((key) => key + ' ' + types[key]).join(' / ');
    const sampleText = formatFeishuPreviewSamples(preview.samplesByType);
    return '\u5171 ' + total + '\u6761\uff0c\u5f85\u5199\u5165 ' + unsynced + '\u6761' + (skipped ? '\uff0c\u5df2\u8df3\u8fc7 ' + skipped + '\u6761' : '') + (typeText ? '\uff0c' + typeText : '') + (sampleText ? '\n' + sampleText : '');
  }

  function formatFeishuPreviewSamples(samplesByType) {
    if (!samplesByType || typeof samplesByType !== 'object') return '';
    return Object.keys(samplesByType).slice(0, 6).map((type) => {
      const group = samplesByType[type] || {};
      const samples = Array.isArray(group.samples) ? group.samples : [];
      const sample = samples[0] || {};
      const brief = [sample.sku || '', sample.summary || ''].filter(Boolean).join(' ');
      return type + '\uff1a' + (group.count || samples.length || 0) + '\u6761' + (brief ? '\uff0c\u4f8b\uff1a' + brief : '');
    }).join('\n');
  }

  async function checkCloudInsightAiStatus() {
    state.insightCloudStatus = '\u6b63\u5728\u68c0\u67e5 AI \u914d\u7f6e...';
    renderShell();
    try {
      const response = await fetchInsightAiStatus();
      state.insightCloudStatus = response && response.configured
        ? 'AI \u5df2\u914d\u7f6e\uff1a' + [response.provider || '', response.model || ''].filter(Boolean).join(' / ')
        : 'AI \u672a\u914d\u7f6e\uff0c\u5c06\u4f7f\u7528\u89c4\u5219\u7248\u603b\u7ed3';
      addLog(response && response.configured ? 'success' : 'warn', 'AI \u914d\u7f6e\u68c0\u67e5', state.insightCloudStatus);
      showToast(state.insightCloudStatus);
    } catch (error) {
      state.insightCloudStatus = 'AI \u914d\u7f6e\u68c0\u67e5\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', 'AI \u914d\u7f6e\u68c0\u67e5\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  async function copyCloudInsightAiReport() {
    state.insightCloudStatus = '\u6b63\u5728\u8bf7\u6c42 AI \u6574\u7406\u6570\u636e...';
    renderShell();
    try {
      const response = await fetchInsightAiReport({ refresh: true });
      const report = response && response.report ? response.report : '';
      if (!report) throw new Error('empty ai report');
      state.insightCloudReport = report;
      state.insightCloudStatus = response.source === 'zhipu'
        ? 'AI \u6574\u7406\u5df2\u590d\u5236'
        : 'AI \u6682\u4e0d\u53ef\u7528\uff0c\u5df2\u590d\u5236\u89c4\u5219\u7248\u603b\u7ed3';
      copyText(report);
      addLog('success', '\u5df2\u590d\u5236 AI \u6d1e\u5bdf\u6574\u7406', response.source || '');
      showToast(L.copied);
    } catch (error) {
      state.insightCloudStatus = 'AI \u6574\u7406\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', 'AI \u6d1e\u5bdf\u6574\u7406\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  async function copyCloudInsightRules() {
    state.insightCloudStatus = '\u6b63\u5728\u751f\u6210\u6e05\u6d17\u89c4\u5219\u5019\u9009...';
    renderShell();
    try {
      const response = await fetchInsightRules();
      const text = response && response.tsv ? response.tsv : '';
      if (!text) throw new Error('empty rules');
      const pkg = response && response.rulePackage;
      if (pkg && Array.isArray(pkg.maintainedRules)) {
        state.maintainedCleaningRules = pkg.maintainedRules;
        state.maintainedCleaningRulesLoaded = true;
      }
      state.insightCloudStatus = pkg
        ? '\u6e05\u6d17\u89c4\u5219\u5019\u9009\u5df2\u590d\u5236\uff1a\u5171 ' + (pkg.total || 0) + '\u6761\uff0c\u9700\u5904\u7406 ' + (pkg.actionableCount || 0) + '\u6761\uff0c\u7591\u4f3c PLM \u7a7a\u503c ' + (pkg.likelyPlmEmptyCount || 0) + '\u6761'
        : '\u6e05\u6d17\u89c4\u5219\u5019\u9009\u5df2\u590d\u5236';
      copyText(text);
      addLog('success', '\u5df2\u590d\u5236\u6e05\u6d17\u89c4\u5219\u5019\u9009', state.insightCloudStatus);
      showToast(L.copied);
    } catch (error) {
      state.insightCloudStatus = '\u6e05\u6d17\u89c4\u5219\u751f\u6210\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u6e05\u6d17\u89c4\u5219\u751f\u6210\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  async function refreshMaintainedCleaningRules() {
    state.insightCloudStatus = '\u6b63\u5728\u62c9\u53d6\u4e91\u7aef\u6e05\u6d17\u89c4\u5219...';
    renderShell();
    try {
      const response = await fetchMaintainedCleaningRules();
      state.maintainedCleaningRules = Array.isArray(response && response.rules) ? response.rules : [];
      state.maintainedCleaningRulesLoaded = true;
      state.insightCloudStatus = '\u4e91\u7aef\u6e05\u6d17\u89c4\u5219\uff1a' + state.maintainedCleaningRules.length + '\u6761';
      addLog('success', '\u4e91\u7aef\u6e05\u6d17\u89c4\u5219\u5df2\u5237\u65b0', state.insightCloudStatus);
    } catch (error) {
      state.insightCloudStatus = '\u6e05\u6d17\u89c4\u5219\u5237\u65b0\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u6e05\u6d17\u89c4\u5219\u5237\u65b0\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  async function summarizeCloudClassificationRules() {
    const samples = collectUnclassifiedClassificationSamples(300);
    if (!samples.length) {
      state.insightCloudStatus = '\u6682\u65e0\u672a\u5206\u7c7b\u4ea7\u54c1';
      renderShell();
      showToast(state.insightCloudStatus);
      return;
    }
    state.insightCloudStatus = '\u6b63\u5728\u8ba9 AI \u603b\u7ed3\u524d ' + samples.length + ' \u6761\u672a\u5206\u7c7b\u4ea7\u54c1...';
    renderShell();
    try {
      const response = await fetchClassificationSummarize(samples);
      const rules = Array.isArray(response && response.rules) ? response.rules : [];
      state.classificationRules = rules;
      const warning = response && response.warning ? '\uff0c\u515c\u5e95\uff1a' + response.warning : '';
      state.insightCloudStatus = '\u5206\u7c7b\u89c4\u5219\u5df2\u751f\u6210\uff1a' + rules.length + '\u6761\uff0c\u672a\u5206\u7c7b\u6837\u672c ' + (response.sampleCount || 0) + '\u6761\uff0c\u6765\u6e90 ' + (response.sampleSource || response.source || '') + warning;
      addLog(response && response.warning ? 'warn' : 'success', 'AI \u603b\u7ed3\u5206\u7c7b\u89c4\u5219', state.insightCloudStatus);
      showToast(state.insightCloudStatus);
    } catch (error) {
      state.insightCloudStatus = 'AI \u603b\u7ed3\u5206\u7c7b\u89c4\u5219\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', 'AI \u603b\u7ed3\u5206\u7c7b\u89c4\u5219\u5931\u8d25', formatErrorMessage(error));
      showToast(state.insightCloudStatus);
    }
    renderShell();
  }

  function collectUnclassifiedClassificationSamples(limit) {
    const result = [];
    (state.index || []).some((item) => {
      if (result.length >= (Number(limit) || 300)) return true;
      const sku = item && item.sku ? String(item.sku) : '';
      if (!sku) return false;
      const data = normalizeData(loadData(sku) || item);
      if (!data || !data.sku) return false;
      const explicitType = String(data.aiProductType || data.aiCategory || '').trim();
      if (explicitType && !/^\u672a\u5206\u7c7b$/i.test(explicitType)) return false;
      const name = String(data.name || item.name || '').trim();
      if (!name) return false;
      result.push({ sku: data.sku, brand: data.brand || '', name, productType: '' });
      return false;
    });
    return result;
  }

  async function viewCloudClassificationRules() {
    state.insightCloudStatus = '\u6b63\u5728\u62c9\u53d6\u5206\u7c7b\u89c4\u5219...';
    renderShell();
    try {
      const response = await fetchClassificationRules();
      const rules = Array.isArray(response && response.rules) ? response.rules : [];
      state.classificationRules = rules;
      const text = formatClassificationRulesForCopy(rules);
      copyText(text || '\u6682\u65e0\u5206\u7c7b\u89c4\u5219');
      state.insightCloudStatus = '\u5206\u7c7b\u89c4\u5219\u5df2\u590d\u5236\uff1a' + rules.length + '\u6761';
      addLog('success', '\u5df2\u67e5\u770b\u5206\u7c7b\u89c4\u5219', state.insightCloudStatus);
      showToast(L.copied);
    } catch (error) {
      state.insightCloudStatus = '\u67e5\u770b\u5206\u7c7b\u89c4\u5219\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u67e5\u770b\u5206\u7c7b\u89c4\u5219\u5931\u8d25', formatErrorMessage(error));
      showToast(state.insightCloudStatus);
    }
    renderShell();
  }

  async function applyCloudClassificationRulesToLocal() {
    state.insightCloudStatus = '\u6b63\u5728\u91cd\u65b0\u5e94\u7528\u5206\u7c7b\u89c4\u5219...';
    renderShell();
    try {
      let rules = Array.isArray(state.classificationRules) && state.classificationRules.length ? state.classificationRules : [];
      if (!rules.length) {
        const response = await fetchClassificationRules();
        rules = Array.isArray(response && response.rules) ? response.rules : [];
        state.classificationRules = rules;
      }
      const result = applyClassificationRulesToLocalCache(rules);
      state.insightCloudStatus = '\u5df2\u91cd\u65b0\u5e94\u7528\u89c4\u5219\uff1a\u66f4\u65b0 ' + result.updated + '/' + result.total + '\u4e2a\u7f16\u7801';
      addLog('success', '\u5df2\u91cd\u65b0\u5e94\u7528\u5206\u7c7b\u89c4\u5219', state.insightCloudStatus);
      showToast(state.insightCloudStatus);
    } catch (error) {
      state.insightCloudStatus = '\u91cd\u65b0\u5e94\u7528\u5206\u7c7b\u89c4\u5219\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u91cd\u65b0\u5e94\u7528\u5206\u7c7b\u89c4\u5219\u5931\u8d25', formatErrorMessage(error));
      showToast(state.insightCloudStatus);
    }
    renderShell();
  }

  async function updateMaintainedCleaningRuleStatus(ruleId, action) {
    if (!ruleId) return;
    const status = action === 'insights-rule-done'
      ? '\u5df2\u5904\u7406'
      : (action === 'insights-rule-ignore' ? '\u5ffd\u7565' : '\u81ea\u52a8');
    state.insightCloudStatus = '\u6b63\u5728\u66f4\u65b0\u89c4\u5219\u72b6\u6001...';
    renderShell();
    try {
      const response = await updateCleaningRuleStatus(ruleId, status);
      if (!response || response.ok === false) throw new Error(response && response.error ? response.error : 'rule status failed');
      await refreshMaintainedCleaningRules();
      state.insightCloudStatus = '\u89c4\u5219\u72b6\u6001\u5df2\u66f4\u65b0\uff1a' + status;
      addLog('success', '\u6e05\u6d17\u89c4\u5219\u72b6\u6001\u5df2\u66f4\u65b0', ruleId + ' -> ' + status);
      showToast(state.insightCloudStatus);
      renderShell();
    } catch (error) {
      state.insightCloudStatus = '\u89c4\u5219\u72b6\u6001\u66f4\u65b0\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u6e05\u6d17\u89c4\u5219\u72b6\u6001\u66f4\u65b0\u5931\u8d25', ruleId + ' ' + formatErrorMessage(error));
      renderShell();
    }
  }

  async function copyCloudInsightFeishuTable(options) {
    const opts = options || {};
    state.insightCloudStatus = opts.fallbackFromSync ? '\u98de\u4e66\u76f4\u5199\u672a\u914d\u7f6e\uff0c\u6b63\u5728\u590d\u5236\u53ef\u7c98\u8d34\u8868\u683c...' : '\u6b63\u5728\u751f\u6210\u98de\u4e66\u8868\u683c\u6570\u636e...';
    renderShell();
    try {
      const response = await fetchInsightFeishuTsv();
      const tsv = response && response.tsv ? response.tsv : '';
      if (!tsv) throw new Error('empty tsv');
      state.insightCloudStatus = opts.fallbackFromSync
        ? '\u98de\u4e66\u76f4\u5199\u4e0d\u53ef\u7528\uff0c\u5df2\u6539\u4e3a\u590d\u5236\u8868\u683c\u6570\u636e\uff0c\u76f4\u63a5\u7c98\u8d34\u5230\u8868\u683c\u5373\u53ef' + (opts.reason ? '\uff1b\u539f\u56e0\uff1a' + opts.reason : '')
        : '\u98de\u4e66\u8868\u683c\u6570\u636e\u5df2\u590d\u5236\uff0c\u76f4\u63a5\u7c98\u8d34\u5230\u8868\u683c\u5373\u53ef\u5206\u5217';
      copyText(tsv);
      addLog('success', opts.fallbackFromSync ? '\u98de\u4e66\u540c\u6b65\u56de\u9000\u4e3a\u590d\u5236\u8868\u683c' : '\u5df2\u590d\u5236\u98de\u4e66\u8868\u683c\u6570\u636e');
      showToast(L.copied);
    } catch (error) {
      state.insightCloudStatus = '\u98de\u4e66\u8868\u683c\u6570\u636e\u751f\u6210\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u98de\u4e66\u8868\u683c\u6570\u636e\u751f\u6210\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  function formatCloudInsightTotals(totals) {
    if (!Array.isArray(totals) || !totals.length) return '\u6682\u65e0\u4e8b\u4ef6';
    return totals.map((item) => {
      const label = item.event_type === 'price' ? '\u4ef7\u683c' : (item.event_type === 'issue' ? '\u5f02\u5e38' : item.event_type);
      return label + ' ' + item.count;
    }).join(' / ');
  }

  function getTodayKey() {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  }

  function normalizeLedgerDate(value) {
    const text = String(value || '').trim();
    const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) return '';
    return [match[1], match[2].padStart(2, '0'), match[3].padStart(2, '0')].join('-');
  }

  function shiftDateKey(value, delta) {
    const key = normalizeLedgerDate(value) || getTodayKey();
    const date = new Date(key + 'T00:00:00');
    date.setDate(date.getDate() + Number(delta || 0));
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  function shiftLedgerMonth(value, delta) {
    const month = normalizeLedgerMonth(value || getTodayKey());
    const match = month.match(/^(\d{4})-(\d{2})$/);
    const date = new Date(match ? Number(match[1]) : new Date().getFullYear(), match ? Number(match[2]) - 1 : new Date().getMonth(), 1);
    date.setMonth(date.getMonth() + Number(delta || 0));
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), '01'].join('-');
  }

  function formatLedgerDateLabel(value) {
    const key = normalizeLedgerDate(value) || getTodayKey();
    const parts = key.split('-');
    return Number(parts[1]) + '\u6708' + Number(parts[2]) + '\u65e5';
  }

  function formatLedgerMinuteLabel(value, fallbackDate) {
    const ms = parseLedgerDateTimeMs(value);
    if (ms) {
      const date = new Date(ms);
      return (date.getMonth() + 1) + '\u6708' + date.getDate() + '\u65e5 ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
    }
    return formatLedgerDateLabel(fallbackDate || value);
  }

  function getNowLedgerMinuteLabel() {
    return formatLedgerMinuteLabel(Date.now());
  }

  function parseLedgerDateTimeMs(value) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
    const text = String(value || '').trim();
    if (!text || text === '--') return 0;
    const full = text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\s+(\d{1,2})[:\uff1a](\d{1,2}))?/);
    if (full) {
      const date = new Date(Number(full[1]), Number(full[2]) - 1, Number(full[3]), Number(full[4] || 0), Number(full[5] || 0), 0, 0);
      return date.getTime();
    }
    const cn = text.match(/(\d{1,2})\s*\u6708\s*(\d{1,2})\s*\u65e5(?:\s+(\d{1,2})[:\uff1a](\d{1,2}))?/);
    if (cn) {
      const date = new Date(new Date().getFullYear(), Number(cn[1]) - 1, Number(cn[2]), Number(cn[3] || 0), Number(cn[4] || 0), 0, 0);
      return date.getTime();
    }
    const parsed = Date.parse(text);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function parseLedgerDateFromText(value) {
    const text = String(value || '').trim();
    if (!text || text === '--') return '';
    const full = text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (full) return [full[1], full[2].padStart(2, '0'), full[3].padStart(2, '0')].join('-');
    const cn = text.match(/(\d{1,2})\s*\u6708\s*(\d{1,2})\s*\u65e5/);
    if (cn) return [String(new Date().getFullYear()), cn[1].padStart(2, '0'), cn[2].padStart(2, '0')].join('-');
    return normalizeLedgerDate(text);
  }

  function getMonthKeyFromDateKey(value) {
    const key = normalizeLedgerDate(value) || parseLedgerDateFromText(value) || getTodayKey();
    return key.slice(0, 7);
  }

  function normalizeLedgerMonth(value) {
    const text = String(value || '').trim();
    const match = text.match(/^(\d{4})-(\d{1,2})$/);
    if (match) return match[1] + '-' + match[2].padStart(2, '0');
    return getMonthKeyFromDateKey(text);
  }

  function getCurrentLedgerMonth() {
    return normalizeLedgerMonth(state.ledgerDate || getTodayKey());
  }

  function getLedgerDesignDate(record) {
    return parseLedgerDateFromText(record && record.designAssignedAt) || normalizeLedgerDate(record && record.date) || getTodayKey();
  }

  function getLedgerFinalizedDate(record) {
    return normalizeLedgerDate(record && record.finalizedDate) || parseLedgerDateFromText(record && record.finalizedAt) || getLedgerDesignDate(record);
  }

  function loadDailyLedger() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(DAILY_LEDGER_KEY, null) : JSON.parse(localStorage.getItem(DAILY_LEDGER_KEY) || 'null');
      return sanitizeLedgerRecords(saved);
    } catch (error) {
      return [];
    }
  }

  function saveDailyLedger() {
    try {
      state.ledgerRecords = sanitizeLedgerRecords(state.ledgerRecords);
      if (typeof GM_setValue === 'function') GM_setValue(DAILY_LEDGER_KEY, state.ledgerRecords);
      else localStorage.setItem(DAILY_LEDGER_KEY, JSON.stringify(state.ledgerRecords));
      queueCloudBackup();
    } catch (error) {
      console.warn('PLM floating helper daily ledger save failed:', error);
    }
  }

  function sanitizeLedgerRecords(records) {
    return (Array.isArray(records) ? records : []).slice(0, 1200).map((item) => ({
      date: normalizeLedgerDate(item.date) || getTodayKey(),
      sku: String(item.sku || '').slice(0, 80),
      brand: cleanName(item.brand || '').slice(0, 120),
      name: cleanName(item.name || '').slice(0, 220),
      skuImageUrl: String(item.skuImageUrl || '').slice(0, 600),
      benchmarkImageUrl: String(item.benchmarkImageUrl || '').slice(0, 600),
      designType: cleanName(item.designType || '').slice(0, 80),
      artPriority: cleanName(item.artPriority || '').slice(0, 80),
      referenceUrl: String(item.referenceUrl || '').slice(0, 800),
      designAssignedAt: String(item.designAssignedAt || '').slice(0, 80),
      developmentAssignedAt: String(item.developmentAssignedAt || '').slice(0, 80),
      packageCode: String(item.packageCode || '').slice(0, 120),
      printCode: String(item.printCode || '').slice(0, 180),
      purchasePrice: normalizeLedgerPurchasePrice(item.purchasePrice),
      boxFileState: normalizeLedgerFileState(item.boxFileState, item.boxFileDone),
      labelFileState: normalizeLedgerFileState(item.labelFileState, item.labelFileDone),
      imagePackState: normalizeLedgerFileState(item.imagePackState, item.imagePackDone),
      boxFileDone: normalizeLedgerFileState(item.boxFileState, item.boxFileDone) === 'done',
      labelFileDone: normalizeLedgerFileState(item.labelFileState, item.labelFileDone) === 'done',
      imagePackDone: normalizeLedgerFileState(item.imagePackState, item.imagePackDone) === 'done',
      status: normalizeLedgerStatus(item.status),
      stage: String(item.stage || '').slice(0, 80) || '待定稿',
      imageGeneratedAt: String(item.imageGeneratedAt || '').slice(0, 40),
      imageGeneratedAtMs: Number(item.imageGeneratedAtMs || 0) || parseLedgerDateTimeMs(item.imageGeneratedAt) || 0,
      finalizedAt: String(item.finalizedAt || '').slice(0, 40),
      finalizedDate: normalizeLedgerDate(item.finalizedDate) || '',
      finalizedAtMs: Number(item.finalizedAtMs || 0) || parseLedgerDateTimeMs(item.finalizedAt) || 0,
      note: String(item.note || '').slice(0, 240),
      createdAt: String(item.createdAt || new Date().toLocaleString()).slice(0, 80),
      createdAtMs: Number(item.createdAtMs || item.updatedAtMs || 0) || Date.now(),
      updatedAt: String(item.updatedAt || new Date().toLocaleString()).slice(0, 80),
      updatedAtMs: Number(item.updatedAtMs || 0) || Date.now(),
    })).filter((item) => item.sku);
  }

  function normalizeLedgerFileState(value, doneFallback) {
    const text = String(value || '').trim();
    if (/^(pending|done|skip)$/.test(text)) return text;
    if (/^(?:\u5b8c\u6210|\u5df2\u5b8c\u6210|done)$/i.test(text)) return 'done';
    if (/^(?:\u4e0d\u9700\u8981|\u65e0\u9700|\u8df3\u8fc7|skip)$/i.test(text)) return 'skip';
    return doneFallback ? 'done' : 'pending';
  }

  function normalizeLedgerPurchasePrice(value) {
    const text = String(value === undefined || value === null ? '' : value).trim().replace(/^¥\s*/, '');
    if (!text) return '';
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return '';
    const number = Number(text);
    return Number.isFinite(number) && number >= 0 ? String(number) : '';
  }

  function nextLedgerFileState(value, doneFallback) {
    const current = normalizeLedgerFileState(value, doneFallback);
    if (current === 'pending') return 'done';
    if (current === 'done') return 'skip';
    return 'pending';
  }

  function ledgerFileStateLabel(value) {
    const stateValue = normalizeLedgerFileState(value);
    if (stateValue === 'done') return '\u5df2\u5b8c\u6210';
    if (stateValue === 'skip') return '\u4e0d\u9700\u8981\u5236\u4f5c\u6587\u4ef6';
    return '\u672a\u5b8c\u6210';
  }

  function normalizeLedgerStatus(value) {
    const text = String(value || '').trim();
    return /^(待出图|待定稿|已定稿|制作中|已完成|异常|作废|跳过)$/.test(text) ? text : '待定稿';
  }

  function getLedgerRecordsForDate(dateKey) {
    const key = normalizeLedgerDate(dateKey) || getTodayKey();
    return (state.ledgerRecords || []).filter((item) => item.date === key).sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0));
  }

  function getLedgerRecordsForMonth(view, monthKey) {
    const month = normalizeLedgerMonth(monthKey || getTodayKey());
    const mode = view === 'finalized' ? 'finalized' : 'design';
    return (state.ledgerRecords || [])
      .filter((item) => {
        if (mode === 'finalized' && (!item.finalizedAt || item.status === '作废')) return false;
        if (mode === 'design' && item.finalizedAt) return false;
        const key = mode === 'finalized' ? getLedgerFinalizedDate(item) : getLedgerDesignDate(item);
        return getMonthKeyFromDateKey(key) === month;
      })
      .sort((a, b) => {
        const dateA = mode === 'finalized' ? getLedgerFinalizedDate(a) : getLedgerDesignDate(a);
        const dateB = mode === 'finalized' ? getLedgerFinalizedDate(b) : getLedgerDesignDate(b);
        if (dateA !== dateB) return dateA < dateB ? 1 : -1;
        if (mode === 'finalized') return (b.finalizedAtMs || b.createdAtMs || 0) - (a.finalizedAtMs || a.createdAtMs || 0);
        return (b.createdAtMs || b.updatedAtMs || 0) - (a.createdAtMs || a.updatedAtMs || 0);
      });
  }

  function groupLedgerRecordsByDate(records, view) {
    const mode = view === 'finalized' ? 'finalized' : 'design';
    const map = new Map();
    (records || []).forEach((item) => {
      const key = mode === 'finalized' ? getLedgerFinalizedDate(item) : getLedgerDesignDate(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, items]) => ({ date, items }));
  }

  function shouldSkipLedgerDrawer(drawer) {
    const text = drawer ? compactText(getVisibleText(drawer)).replace(/\s+/g, '') : '';
    return /已完成|已作废|已拒绝/.test(text);
  }

  function upsertDailyLedgerFromData(data, options) {
    if (!data || !data.sku) return null;
    const opts = options || {};
    const assignedDate = parseLedgerDateFromText(data.designAssignedAt);
    const dateKey = normalizeLedgerDate(opts.date) || assignedDate || getTodayKey();
    if (opts.requireCurrentMonth && (!assignedDate || getMonthKeyFromDateKey(dateKey) !== getMonthKeyFromDateKey(getTodayKey()))) return null;
    const nowText = new Date().toLocaleString();
    const nowMs = Date.now();
    const sku = data.sku;
    const dateMonth = getMonthKeyFromDateKey(dateKey);
    const existing = (state.ledgerRecords || []).find((item) => item.sku === sku && getMonthKeyFromDateKey(item.date) === dateMonth);
    const imageUrl = getProductThumbUrl(data) || data.skuImageUrl || data.skuImageFallbackUrl || '';
    const next = {
      ...(existing || {}),
      date: dateKey,
      sku,
      brand: cleanName(data.brand || (existing && existing.brand) || ''),
      name: cleanName(data.name || (existing && existing.name) || ''),
      skuImageUrl: imageUrl || (existing && existing.skuImageUrl) || '',
      benchmarkImageUrl: String(data.benchmarkImageUrl || data.benchmarkImageFallbackUrl || (existing && existing.benchmarkImageUrl) || ''),
      designType: cleanName(data.designType || (existing && existing.designType) || ''),
      artPriority: cleanName(data.artPriority || (existing && existing.artPriority) || ''),
      referenceUrl: String(data.referenceUrl || (existing && existing.referenceUrl) || ''),
      designAssignedAt: String(data.designAssignedAt || (existing && existing.designAssignedAt) || ''),
      developmentAssignedAt: String(data.developmentAssignedAt || (existing && existing.developmentAssignedAt) || ''),
      packageCode: String(data.packageCode || (existing && existing.packageCode) || ''),
      printCode: String(data.printCode || (existing && existing.printCode) || ''),
      purchasePrice: normalizeLedgerPurchasePrice(opts.purchasePrice !== undefined ? opts.purchasePrice : (data.purchasePrice || (existing && existing.purchasePrice) || '')),
      boxFileState: normalizeLedgerFileState(opts.boxFileState !== undefined ? opts.boxFileState : (existing && existing.boxFileState), opts.boxFileDone !== undefined ? opts.boxFileDone : (existing && existing.boxFileDone)),
      labelFileState: normalizeLedgerFileState(opts.labelFileState !== undefined ? opts.labelFileState : (existing && existing.labelFileState), opts.labelFileDone !== undefined ? opts.labelFileDone : (existing && existing.labelFileDone)),
      imagePackState: normalizeLedgerFileState(opts.imagePackState !== undefined ? opts.imagePackState : (existing && existing.imagePackState), opts.imagePackDone !== undefined ? opts.imagePackDone : (existing && existing.imagePackDone)),
      boxFileDone: normalizeLedgerFileState(opts.boxFileState !== undefined ? opts.boxFileState : (existing && existing.boxFileState), opts.boxFileDone !== undefined ? opts.boxFileDone : (existing && existing.boxFileDone)) === 'done',
      labelFileDone: normalizeLedgerFileState(opts.labelFileState !== undefined ? opts.labelFileState : (existing && existing.labelFileState), opts.labelFileDone !== undefined ? opts.labelFileDone : (existing && existing.labelFileDone)) === 'done',
      imagePackDone: normalizeLedgerFileState(opts.imagePackState !== undefined ? opts.imagePackState : (existing && existing.imagePackState), opts.imagePackDone !== undefined ? opts.imagePackDone : (existing && existing.imagePackDone)) === 'done',
      status: normalizeLedgerStatus(opts.status || (existing && existing.status) || '待定稿'),
      stage: opts.stage || (existing && existing.stage) || '待定稿',
      note: opts.note !== undefined ? String(opts.note || '') : ((existing && existing.note) || ''),
      imageGeneratedAt: opts.imageGeneratedAt !== undefined ? String(opts.imageGeneratedAt || '') : ((existing && existing.imageGeneratedAt) || ''),
      imageGeneratedAtMs: opts.imageGeneratedAtMs !== undefined ? (Number(opts.imageGeneratedAtMs || 0) || 0) : (Number(existing && existing.imageGeneratedAtMs) || 0),
      finalizedAt: opts.finalizedAt !== undefined ? String(opts.finalizedAt || '') : ((existing && existing.finalizedAt) || ''),
      finalizedDate: opts.finalizedDate !== undefined ? normalizeLedgerDate(opts.finalizedDate) : ((existing && existing.finalizedDate) || ''),
      finalizedAtMs: opts.finalizedAtMs !== undefined ? (Number(opts.finalizedAtMs || 0) || 0) : (Number(existing && existing.finalizedAtMs) || 0),
      createdAt: (existing && existing.createdAt) || nowText,
      createdAtMs: (existing && existing.createdAtMs) || nowMs,
      updatedAt: nowText,
      updatedAtMs: nowMs,
    };
    state.ledgerRecords = [next].concat((state.ledgerRecords || []).filter((item) => !(item.sku === sku && getMonthKeyFromDateKey(item.date) === dateMonth))).slice(0, 1200);
    saveDailyLedger();
    return next;
  }

  function updateDailyLedgerForSku(sku, patch, dateKey) {
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const data = normalizeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }));
    return upsertDailyLedgerFromData(data, { ...(patch || {}), date: key });
  }

  function copyLedgerTsv(dateKey) {
    const rows = getLedgerRecordsForMonth('finalized', normalizeLedgerMonth(dateKey || state.ledgerDate)).filter((item) => item.finalizedAt && item.status !== '作废');
    if (!rows.length) {
      showToast('本月没有可复制的已定稿记录');
      return;
    }
    const tsv = rows.map((item) => {
      const productName = [item.brand, item.name].filter(Boolean).join(' ') || item.name || '';
      const mainImageMark = item.skuImageUrl ? '主图' : '';
      const skuImageMark = item.skuImageUrl ? 'SKU图' : '';
      const date = item.finalizedAt || '';
      return [productName, item.sku || '', mainImageMark, date, skuImageMark, date].map((value) => String(value || '').replace(/[\t\r\n]+/g, ' ')).join('\t');
    }).join('\n');
    copyText(tsv);
    showToast('本月登记已复制：' + rows.length + '条');
  }

  function copyFinalizedLedgerSkus(dateKey) {
    const today = getTodayKey();
    const rows = getLedgerRecordsForMonth('finalized', normalizeLedgerMonth(today)).filter((item) => item.finalizedAt && item.status !== '作废' && getLedgerFinalizedDate(item) === today);
    if (!rows.length) {
      showToast('今天还没有已定稿编码');
      return;
    }
    copyText(rows.map((item) => item.sku).filter(Boolean).join('\n'));
    showToast('已复制今日定稿编码：' + rows.length + '个');
  }

  function exportLedgerRecords(dateKey) {
    const month = normalizeLedgerMonth(dateKey || state.ledgerDate);
    const records = getLedgerRecordsForMonth('design', month);
    const payload = { plugin: L.title, version: SCRIPT_VERSION, exportedAt: new Date().toLocaleString(), month, records };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plm-daily-ledger-' + payload.month + '.json';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
    showToast('本月记录已导出');
  }

  function clearLedgerDate(dateKey) {
    const key = normalizeLedgerDate(dateKey) || getTodayKey();
    if (!window.confirm('确定清空 ' + formatLedgerDateLabel(key) + ' 的今日工作台记录吗？')) return;
    state.ledgerRecords = (state.ledgerRecords || []).filter((item) => item.date !== key);
    saveDailyLedger();
    renderShell();
  }

  function updateLedgerFromAction(action, sku, dateKey, options) {
    if (!sku) return;
    state.ledgerMenuSku = '';
    if (action === 'ledger-image-generated') {
      state.ledgerFlowTransitionSku = sku;
      window.clearTimeout(state.ledgerFlowTransitionTimer);
      state.ledgerFlowTransitionTimer = window.setTimeout(() => {
        if (state.ledgerFlowTransitionSku !== sku) return;
        state.ledgerFlowTransitionSku = '';
        const current = (state.ledgerRecords || []).find((item) => item.sku === sku && item.date === normalizeLedgerDate(dateKey));
        if (current) refreshLedgerCard(current);
      }, 680);
    }
    if (action === 'ledger-remove') {
      const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
      state.ledgerRecords = (state.ledgerRecords || []).filter((item) => !(item.date === key && item.sku === sku));
      saveDailyLedger();
      renderShell();
      return;
    }
    const today = getNowLedgerMinuteLabel();
    const todayKey = getTodayKey();
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const existing = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
    const patch = action === 'ledger-image-generated'
      ? { status: '待定稿', stage: '待定稿', imageGeneratedAt: today, imageGeneratedAtMs: Date.now(), note: '已出图，等待定稿' }
      : action === 'ledger-unmark-image-generated'
        ? { status: '待出图', stage: '待出图', imageGeneratedAt: '', imageGeneratedAtMs: 0, note: '已撤回出图' }
        : action === 'ledger-unfinalize'
          ? { status: '待定稿', stage: '待定稿', finalizedAt: '', finalizedDate: '', finalizedAtMs: 0, note: '已撤回定稿' }
          : action === 'ledger-finalize'
            ? { status: '已定稿', stage: '已定稿', finalizedAt: today, finalizedDate: todayKey, finalizedAtMs: Date.now(), note: '手动定稿' }
      : action === 'ledger-void'
        ? { status: '作废', stage: '作废', note: '手动作废' }
        : { status: '已完成', stage: '完成', note: '手动完成' };
    const opts = options || {};
    const finalPatch = opts.purchasePrice ? { ...patch, purchasePrice: opts.purchasePrice } : patch;
    const updatedRecord = updateDailyLedgerForSku(sku, finalPatch, key);
    if (action === 'ledger-finalize' && opts.purchasePrice) {
      const currentData = normalizeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }));
      const changed = String(currentData.purchasePrice || '') !== opts.purchasePrice;
      const pricedData = normalizeData({ ...currentData, purchasePrice: opts.purchasePrice });
      saveData(sku, pricedData);
      if (state.data && state.data.sku === sku) state.data = pricedData;
      if (changed) recordCommerceInsight(pricedData, null, { price: opts.purchasePrice, source: 'ledger-finalize' });
    }
    refreshLedgerCard(updatedRecord);
  }

  function openLedgerFinalizedTimeEditor(sku, dateKey) {
    if (!sku) return;
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const existing = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
    if (!existing || !existing.finalizedAt) {
      showToast('请先定稿后再修改时间');
      return;
    }
    state.ledgerTimeEditor = { sku, dateKey: key, timeMs: existing.finalizedAtMs || parseLedgerDateTimeMs(existing.finalizedAt) || Date.now() };
    renderShell();
  }

  function saveLedgerFinalizedTimeEditor() {
    const editor = state.ledgerTimeEditor;
    if (!editor) return;
    const panel = ensurePanel();
    const dateInput = panel.querySelector('.pfh-ledger-time-date');
    const hour = panel.querySelector('.pfh-ledger-time-hour');
    const minute = panel.querySelector('.pfh-ledger-time-minute');
    const value = String(dateInput && dateInput.value || '').trim() + ' ' + String(hour && hour.value || '').trim().padStart(2, '0') + ':' + String(minute && minute.value || '').trim().padStart(2, '0');
    const timeMs = parseLedgerDateTimeMs(value);
    if (!timeMs) {
      showToast('时间格式不正确，请使用 2026-07-10 14:30');
      return;
    }
    const date = new Date(timeMs);
    const finalizedDate = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    updateDailyLedgerForSku(editor.sku, {
      status: '已定稿',
      stage: '已定稿',
      finalizedAt: formatLedgerMinuteLabel(timeMs),
      finalizedDate,
      finalizedAtMs: timeMs,
      note: '已修改定稿时间',
    }, editor.dateKey);
    state.ledgerTimeEditor = null;
    showToast('定稿时间已更新');
    renderShell();
  }

  function updateLedgerTimeEditorPreset(action) {
    const editor = state.ledgerTimeEditor;
    if (!editor) return;
    const date = new Date();
    if (action === 'ledger-time-yesterday') date.setDate(date.getDate() - 1);
    else if (action === 'ledger-time-day-before') date.setDate(date.getDate() - 2);
    date.setHours(9, 0, 0, 0);
    editor.timeMs = date.getTime();
    const panel = ensurePanel();
    const dateInput = panel.querySelector('.pfh-ledger-time-date');
    const hourInput = panel.querySelector('.pfh-ledger-time-hour');
    const minuteInput = panel.querySelector('.pfh-ledger-time-minute');
    if (dateInput) dateInput.value = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    if (hourInput) hourInput.value = String(date.getHours()).padStart(2, '0');
    if (minuteInput) minuteInput.value = String(date.getMinutes()).padStart(2, '0');
  }

  function formatLedgerInputDateTime(value) {
    const timeMs = parseLedgerDateTimeMs(value);
    const date = new Date(timeMs || Date.now());
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') +
      ' ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
  }

  function toggleLedgerWorkFlag(action, sku, dateKey) {
    if (!sku) return;
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const existing = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
    const field = action === 'ledger-toggle-box-file'
      ? 'boxFileState'
      : (action === 'ledger-toggle-label-file' ? 'labelFileState' : 'imagePackState');
    const doneField = action === 'ledger-toggle-box-file'
      ? 'boxFileDone'
      : (action === 'ledger-toggle-label-file' ? 'labelFileDone' : 'imagePackDone');
    const label = field === 'boxFileState' ? '\u7eb8\u76d2\u6587\u4ef6' : (field === 'labelFileState' ? '\u6807\u7b7e\u5370\u5237\u6587\u4ef6' : '\u56fe\u5305');
    const nextValue = nextLedgerFileState(existing && existing[field], existing && existing[doneField]);
    const updatedRecord = updateDailyLedgerForSku(sku, { [field]: nextValue, [doneField]: nextValue === 'done', note: label + ledgerFileStateLabel(nextValue) }, key);
    refreshLedgerCard(updatedRecord);
  }

  function openLedgerReference(sku, dateKey) {
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const record = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
    const url = record && record.referenceUrl;
    if (!url) {
      showToast('这个编码没有参考链接');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function openLedgerSku(sku) {
    if (!sku) return;
    const data = normalizeData(loadData(sku) || { sku });
    state.selectedSku = sku;
    state.data = data;
    state.detailReturnView = state.view || 'ledger';
    state.view = 'detail';
    state.copywritingMode = false;
    expandPanel();
    renderShell();
  }

  function getLedgerStatusClass(status) {
    if (status === '已完成') return 'done';
    if (status === '异常') return 'error';
    if (status === '作废') return 'void';
    if (status === '已定稿') return 'final';
    if (status === '制作中') return 'doing';
    if (status === '跳过') return 'skip';
    return 'draft';
  }

  function buildCachePayload() {
    const items = {};
    state.index.forEach((item) => {
      const data = loadData(item.sku);
      if (data) items[item.sku] = data;
    });
    return {
      plugin: L.title,
      version: SCRIPT_VERSION,
      exportedAt: new Date().toLocaleString(),
      backupOwnerName: getCloudBackupOwnerName(),
      includesImageLinks: true,
      index: state.index,
      items,
      uploadRecords: {
        queue: sanitizeUploadRecords(state.uploadQueue || loadUploadQueue()),
        history: sanitizeUploadRecords(state.uploadHistory || loadUploadHistory()),
      },
      dailyLedger: sanitizeLedgerRecords(state.ledgerRecords || loadDailyLedger()),
      insights: state.insights || emptyInsights(),
    };
  }

  async function encodeCloudBackupPayload(payload) {
    const serialized = JSON.stringify(payload);
    if (serialized.length < 400000 || typeof CompressionStream !== 'function') return payload;
    const stream = new Blob([serialized], { type: 'application/json' })
      .stream()
      .pipeThrough(new CompressionStream('gzip'));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    return {
      plugin: payload.plugin || L.title,
      version: payload.version || SCRIPT_VERSION,
      exportedAt: payload.exportedAt || new Date().toLocaleString(),
      backupOwnerName: payload.backupOwnerName || '',
      compression: 'gzip-base64',
      uncompressedLength: serialized.length,
      data: bytesToBase64(compressed),
    };
  }

  async function decodeCloudBackupPayload(payload) {
    if (!payload || payload.compression !== 'gzip-base64' || !payload.data) return payload;
    if (typeof DecompressionStream !== 'function') throw new Error('\u5f53\u524d\u6d4f\u89c8\u5668\u65e0\u6cd5\u89e3\u538b\u4e91\u5907\u4efd\uff0c\u8bf7\u4f7f\u7528\u6700\u65b0\u7248 Chrome');
    const compressed = base64ToArrayBuffer(payload.data);
    const stream = new Blob([compressed])
      .stream()
      .pipeThrough(new DecompressionStream('gzip'));
    const serialized = await new Response(stream).text();
    return JSON.parse(serialized);
  }

  function bytesToBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
  }

  function sanitizeUploadRecords(records) {
    return (Array.isArray(records) ? records : []).slice(0, 300).map((item) => ({
      ...item,
      xlsxKey: '',
      zipKey: '',
      selected: false,
    }));
  }

  function handleImportFile(event) {
    const file = event.target && event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importCachePayload(JSON.parse(String(reader.result || '{}')));
        showToast(L.importDone);
        state.view = 'about';
        renderShell();
      } catch (error) {
        console.warn('PLM floating helper import failed:', error);
        showToast(L.importFailed);
      } finally {
        event.target.value = '';
      }
    };
    reader.onerror = () => {
      showToast(L.importFailed);
      event.target.value = '';
    };
    reader.readAsText(file, 'utf-8');
  }

  function importCachePayload(payload) {
    const items = payload && payload.items ? payload.items : payload;
    if (!items || typeof items !== 'object') throw new Error('Invalid cache payload');
    Object.keys(items).forEach((sku) => {
      const data = normalizeData({ ...items[sku], sku: (items[sku] && items[sku].sku) || sku });
      if (!data.sku) return;
      saveDataDirect(data.sku, data);
      upsertIndex(data);
    });
    if (Array.isArray(payload.index)) {
      payload.index.forEach((item) => {
        const existing = state.index.find((entry) => entry.sku === item.sku);
        if (!existing) return;
        if (item.brand && !existing.brand) existing.brand = item.brand;
        if (item.pinned) existing.pinned = true;
        if (item.pinOrder) existing.pinOrder = item.pinOrder;
      });
      saveIndex();
    }
    if (payload.uploadRecords && typeof payload.uploadRecords === 'object') {
      if (Array.isArray(payload.uploadRecords.queue)) {
        state.uploadQueue = sanitizeUploadRecords(payload.uploadRecords.queue).map((item) => ({
          ...item,
          status: item.status && /\u6210\u529f|\u5931\u8d25|\u5df2\u8df3\u8fc7|\u5df2\u4fdd\u5b58/.test(item.status) ? item.status : '\u8bf7\u8865\u5145\u6587\u4ef6',
          step: item.step || '\u4e91\u5907\u4efd\u6062\u590d\uff0c\u9700\u91cd\u65b0\u9009\u62e9\u6587\u4ef6',
        }));
        saveUploadQueue();
      }
      if (Array.isArray(payload.uploadRecords.history)) {
        state.uploadHistory = sanitizeUploadRecords(payload.uploadRecords.history);
        saveUploadHistory();
      }
    }
    if (Array.isArray(payload.dailyLedger)) {
      const imported = sanitizeLedgerRecords(payload.dailyLedger);
      const importedKeys = new Set(imported.map((item) => item.date + '|' + item.sku));
      state.ledgerRecords = imported.concat((state.ledgerRecords || loadDailyLedger()).filter((item) => !importedKeys.has(item.date + '|' + item.sku))).slice(0, 1200);
      saveDailyLedger();
    }
    if (payload.insights && typeof payload.insights === 'object') {
      state.insights = sanitizeInsights(payload.insights);
      saveInsights();
    }
  }

  function getCloudBackupKey() {
    return String(state.settings.cloudBackupKey || '').trim();
  }

  function getCloudBackupOwnerName() {
    const backupKey = getCloudBackupKey();
    if (!backupKey) return '';
    const savedName = String(state.settings.cloudBackupOwnerName || '').trim();
    if (state.settings.cloudBackupOwnerKey === backupKey && savedName) return savedName;
    const name = findCurrentPlmUserName();
    state.settings.cloudBackupOwnerKey = backupKey;
    state.settings.cloudBackupOwnerName = name;
    saveSettings(state.settings);
    return name;
  }

  function findCurrentPlmUserName() {
    const candidates = Array.from(document.querySelectorAll(
      '.btnBoxMainText.ant-dropdown-trigger, [data-user-name], [data-username], .user-name, .userName, .username, .nick-name, .nickName, .nickname, .ant-layout-header .ant-dropdown-trigger, header .ant-dropdown-trigger, [class*="user-info"], [class*="userInfo"], [class*="account-name"], [class*="accountName"], [class*="profile-name"], [class*="profileName"]'
    )).filter(isVisibleElement);
    for (const element of candidates) {
      const ownText = Array.from(element.childNodes || []).filter((node) => node.nodeType === 3).map((node) => node.textContent || '').join(' ').trim();
      const value = String(element.getAttribute('data-user-name') || element.getAttribute('data-username') || ownText || element.innerText || element.textContent || '').trim().replace(/\s+/g, ' ');
      if (/^[\u4e00-\u9fa5A-Za-z][\u4e00-\u9fa5A-Za-z ._-]{1,30}$/.test(value) && !/^(PLM|\u7528\u6237|\u8d26\u53f7|\u6211\u7684)$/.test(value) && !/\u9000\u51fa|\u767b\u5f55|\u8bbe\u7f6e|\u5e2e\u52a9/.test(value)) return value;
    }
    return '';
  }

  function getCloudBackupStatusText() {
    return state.cloudBackupStatus || state.settings.cloudBackupStatus || L.cloudBackupReady;
  }

  function getInsightAiModelSetting() {
    return state.settings && state.settings.insightAiModel === 'gemini-3.5-flash' ? 'gemini-3.5-flash' : 'glm-4.7-flash';
  }

  function setCloudBackupStatus(text) {
    state.cloudBackupStatus = text || '';
    state.settings.cloudBackupStatus = state.cloudBackupStatus;
    saveSettings(state.settings);
    const status = ensurePanel().querySelector('.pfh-cloud-status');
    if (status) status.textContent = getCloudBackupStatusText();
  }

  function queueCloudBackup() {
    if (!getCloudBackupKey()) return;
    state.cloudBackupQueued = true;
    window.clearTimeout(state.cloudBackupTimer);
    state.cloudBackupTimer = window.setTimeout(() => runQueuedCloudBackup(), CLOUD_BACKUP_DEBOUNCE_MS);
  }

  async function runQueuedCloudBackup() {
    if (!state.cloudBackupQueued || state.cloudBackupRunning) return;
    state.cloudBackupQueued = false;
    await saveCloudBackup({ silent: true });
    if (state.cloudBackupQueued) {
      window.clearTimeout(state.cloudBackupTimer);
      state.cloudBackupTimer = window.setTimeout(() => runQueuedCloudBackup(), CLOUD_BACKUP_DEBOUNCE_MS);
    }
  }

  async function saveCloudBackupNow() {
    window.clearTimeout(state.cloudBackupTimer);
    state.cloudBackupQueued = false;
    const input = ensurePanel().querySelector('.pfh-cloud-backup-key');
    if (input) {
      state.settings.cloudBackupKey = input.value.trim();
      saveSettings(state.settings);
    }
    try {
      await saveCloudBackup({ silent: false });
    } catch (error) {
      console.warn('PLM floating helper cloud backup failed:', error);
    }
  }

  async function saveCloudBackup(options) {
    const backupKey = getCloudBackupKey();
    if (!backupKey) {
      if (!(options && options.silent)) showToast(L.cloudBackupMissingKey);
      return false;
    }
    if (backupKey.length < 4) {
      if (!(options && options.silent)) showToast(L.cloudBackupKeyTooShort);
      return false;
    }
    if (state.cloudBackupRunning) {
      state.cloudBackupQueued = true;
      return false;
    }
    state.cloudBackupRunning = true;
    setCloudBackupStatus(L.cloudBackupSaving);
    if (!(options && options.silent)) showToast(L.cloudBackupSaving);
    try {
      const payload = buildCachePayload();
      if (!payload.backupOwnerName) throw new Error(L.cloudBackupOwnerMissing);
      const cloudPayload = await encodeCloudBackupPayload(payload);
      const response = await cloudRequest('/backup/save', {
        method: 'POST',
        body: {
          backupKey,
          version: SCRIPT_VERSION,
          payload: cloudPayload,
        },
      });
      if (!response || !response.ok) throw new Error(response && response.error ? response.error : 'save failed');
      setCloudBackupStatus(L.cloudBackupSavedAt + ' ' + new Date().toLocaleTimeString() + '\uff0c' + state.index.length + '\u4e2a\u7f16\u7801');
      addLog('success', '\u4e91\u5907\u4efd\u4e0a\u4f20\u6210\u529f', state.index.length + '\u4e2a\u7f16\u7801');
      if (!(options && options.silent)) showToast(L.cloudBackupSaved);
      return true;
    } catch (error) {
      const errorMessage = formatCloudBackupSaveError(error);
      console.warn('PLM floating helper cloud backup save failed:', error);
      setCloudBackupStatus(L.cloudBackupFailed + '\uff1a' + errorMessage);
      addLog('error', '\u4e91\u5907\u4efd\u4e0a\u4f20\u5931\u8d25', errorMessage);
      if (!(options && options.silent)) showToast(L.cloudBackupFailed + '\uff1a' + errorMessage);
      return false;
    } finally {
      state.cloudBackupRunning = false;
    }
  }

  function formatCloudBackupSaveError(error) {
    const cloudData = error && error.cloudData ? error.cloudData : {};
    if (cloudData.error === 'backup owner mismatch') {
      const ownerName = String(cloudData.ownerName || '').trim() || '\u5176\u4ed6\u7528\u6237';
      const currentName = String(cloudData.currentOwnerName || getCloudBackupOwnerName() || '').trim();
      return '\u8be5\u5907\u4efd\u5bc6\u94a5\u5df2\u7ed1\u5b9a\u300c' + ownerName + '\u300d' + (currentName ? '\uff0c\u5f53\u524d PLM \u7528\u6237\u4e3a\u300c' + currentName + '\u300d' : '') + '\uff0c\u5df2\u963b\u6b62\u8986\u76d6';
    }
    if (cloudData.error === 'payload too large' || (error && error.message === 'payload too large')) {
      return '\u4e91\u5907\u4efd\u538b\u7f29\u540e\u4ecd\u8d85\u8fc7\u4e0a\u9650';
    }
    return error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef';
  }

  async function restoreCloudBackup() {
    const input = ensurePanel().querySelector('.pfh-cloud-backup-key');
    if (input) {
      state.settings.cloudBackupKey = input.value.trim();
      saveSettings(state.settings);
    }
    const backupKey = getCloudBackupKey();
    if (!backupKey) {
      showToast(L.cloudBackupMissingKey);
      return;
    }
    if (backupKey.length < 4) {
      showToast(L.cloudBackupKeyTooShort);
      return;
    }
    if (!window.confirm('\u786e\u5b9a\u8981\u4ece\u4e91\u5907\u4efd\u6062\u590d\u6570\u636e\u5417\uff1f')) return;
    setCloudBackupStatus(L.cloudBackupRestoring);
    showToast(L.cloudBackupRestoring);
    try {
      const response = await cloudRequest('/backup/load?backupKey=' + encodeURIComponent(backupKey), { method: 'GET' });
      if (!response || !response.found) {
        setCloudBackupStatus(L.cloudBackupNotFound);
        showToast(L.cloudBackupNotFound);
        return;
      }
      importCachePayload(await decodeCloudBackupPayload(response.payload));
      saveSettings(state.settings);
      setCloudBackupStatus(L.cloudBackupRestored + '\uff1a' + state.index.length + '\u4e2a\u7f16\u7801');
      addLog('success', '\u4e91\u5907\u4efd\u6062\u590d\u6210\u529f', state.index.length + '\u4e2a\u7f16\u7801');
      showToast(L.cloudBackupRestored);
      state.view = 'about';
      renderShell();
    } catch (error) {
      console.warn('PLM floating helper cloud backup restore failed:', error);
      setCloudBackupStatus(L.cloudBackupFailed + '\uff1a' + (error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef'));
      addLog('error', '\u4e91\u5907\u4efd\u6062\u590d\u5931\u8d25', error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef');
      showToast(L.cloudBackupFailed + '\uff1a' + (error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef'));
    }
  }

  function buildPackBoxKey(data) {
    if (!data) return '';
    const parts = [data.packageLength, data.packageWidth, data.packageHeight]
      .map((value) => normalizePackDimensionPart(value))
      .filter(Boolean);
    return parts.length === 3 ? parts.join('x') : '';
  }

  function normalizePackDimensionPart(value) {
    const text = String(value || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/\u5398\u7c73|\u516c\u5206/g, 'cm')
      .replace(/[\u00d7*]/g, 'x');
    const cmPart = text.split('/')[0].replace(/cm/g, '');
    const match = cmPart.match(/\d+(?:\.\d+)?/);
    if (!match) return '';
    const number = Number(match[0]);
    return Number.isFinite(number) && number > 0 ? trimNumber(number) : '';
  }

  async function fetchPackRecommendation(boxKey) {
    return cloudRequest('/pack/recommend?boxKey=' + encodeURIComponent(boxKey), { method: 'GET' });
  }

  function schedulePackAiEstimate(data) {
    const boxKey = buildPackBoxKey(data);
    if (!boxKey) {
      if (hasPackDimensionInput(data)) showPackAiToast('\u88c5\u7bb1\u6570\uff1a\u7eb8\u76d2\u5c3a\u5bf8\u4e0d\u5b8c\u6574\uff0c\u65e0\u6cd5\u8ba1\u7b97');
      return;
    }
    if (state.packAiEstimatingKeys.has(boxKey)) {
      showPackAiToast('\u88c5\u7bb1\u6570\uff1a' + boxKey + ' \u6b63\u5728\u8ba1\u7b97\u4e2d');
      return;
    }
    const failedAt = state.packAiFailedAt && state.packAiFailedAt[boxKey] || 0;
    if (failedAt && Date.now() - failedAt < 10 * 60 * 1000) {
      showPackAiToast('\u88c5\u7bb1\u6570\uff1a' + boxKey + ' \u521a\u521a\u5931\u8d25\u8fc7\uff0c10\u5206\u949f\u540e\u91cd\u8bd5');
      return;
    }
    state.packAiEstimatingKeys.add(boxKey);
    window.setTimeout(() => runPackAiEstimate(data, boxKey).catch((error) => {
      console.warn('PLM floating helper pack AI estimate failed:', error);
      showPackAiToast('\u88c5\u7bb1\u6570\u8ba1\u7b97\u5931\u8d25\uff1a' + formatErrorMessage(error));
      state.packAiFailedAt[boxKey] = Date.now();
    }).finally(() => {
      state.packAiEstimatingKeys.delete(boxKey);
    }), 100);
  }

  async function runPackAiEstimate(data, boxKey) {
    const recommendation = await fetchPackRecommendation(boxKey).catch(() => null);
    if (recommendation && recommendation.found && recommendation.packCount) {
      showPackAiToast('\u88c5\u7bb1\u6570\uff1a\u5df2\u5b58\u5728\u5386\u53f2 ' + recommendation.packCount);
      return recommendation;
    }
    showPackAiToast('\u88c5\u7bb1\u6570\uff1a\u672a\u67e5\u5230\u5386\u53f2\uff0c\u540e\u53f0\u8ba1\u7b97\u4e2d ' + boxKey);
    const estimated = await requestPackAiEstimate(boxKey, data && data.sku);
    if (estimated && estimated.packCount) {
      showPackAiToast('\u88c5\u7bb1\u6570\uff1a\u5df2\u5199\u5165 ' + estimated.packCount + (estimated.source ? '\uff08' + estimated.source + '\uff09' : ''));
      if (state.excelPanelOpen && state.data && data && state.data.sku === data.sku && !state.excelPackQty) {
        state.excelPackQty = String(estimated.packCount);
        state.excelStatus = L.excelPackRecommended + ': ' + estimated.packCount;
        renderShell();
      }
      return estimated;
    }
    return null;
  }

  function hasPackDimensionInput(data) {
    return Boolean(data && (data.packageLength || data.packageWidth || data.packageHeight || data.packageSizeText));
  }

  function showPackAiToast(text) {
    showToast(text);
  }

  async function requestPackAiEstimate(boxKey, sku) {
    return cloudRequest('/pack/ai-estimate', {
      method: 'POST',
      body: {
        boxKey,
        sku: String(sku || ''),
      },
    });
  }

  async function savePackRecord(boxKey, packCount, sku) {
    const count = Number.parseInt(String(packCount || '').replace(/[^0-9]/g, ''), 10);
    if (!boxKey || !Number.isInteger(count) || count <= 0) return false;
    const response = await cloudRequest('/pack/record', {
      method: 'POST',
      body: {
        boxKey,
        packCount: count,
        sku: String(sku || ''),
        source: 'plm-helper',
      },
    });
    return Boolean(response && response.ok);
  }

  function syncInsightEvent(eventType, payload) {
    window.setTimeout(() => {
      cloudRequest('/insights/record', {
        method: 'POST',
        body: {
          ...(payload || {}),
          eventType,
          source: (payload && payload.source) || 'plm-helper',
          version: SCRIPT_VERSION,
        },
      }).catch((error) => {
        addLog('warn', '\u4e91\u7aef\u6d1e\u5bdf\u540c\u6b65\u5931\u8d25', formatErrorMessage(error));
      });
    }, 0);
  }

  async function fetchInsightSummary() {
    return cloudRequest('/insights/summary', { method: 'GET' });
  }

  async function fetchInsightReport() {
    return cloudRequest('/insights/report', { method: 'GET' });
  }

  async function fetchInsightAiReport(options) {
    const opts = options || {};
    const params = new URLSearchParams();
    params.set('model', getInsightAiModelSetting());
    if (opts.refresh) params.set('refresh', '1');
    return cloudRequest('/insights/ai-report?' + params.toString(), { method: 'GET' });
  }

  async function fetchInsightAiStatus() {
    return cloudRequest('/insights/ai-status?model=' + encodeURIComponent(getInsightAiModelSetting()), { method: 'GET' });
  }

  async function fetchInsightReadiness() {
    return cloudRequest('/insights/readiness?model=' + encodeURIComponent(getInsightAiModelSetting()), { method: 'GET' });
  }

  async function fetchInsightRules() {
    return cloudRequest('/insights/rules', { method: 'GET' });
  }

  async function fetchClassificationRules() {
    return cloudRequest('/insights/classification-rules?limit=240', { method: 'GET' });
  }

  async function fetchClassificationSummarize(samples) {
    return cloudRequest('/insights/classification-summarize', { method: 'POST', timeoutMs: 90000, body: { version: SCRIPT_VERSION, aiModel: getInsightAiModelSetting(), samples: Array.isArray(samples) ? samples.slice(0, 300) : [] } });
  }

  async function fetchMaintainedCleaningRules() {
    return cloudRequest('/insights/rules/maintained?limit=50', { method: 'GET' });
  }

  async function updateCleaningRuleStatus(ruleId, status) {
    return cloudRequest('/insights/rules/status', {
      method: 'POST',
      body: {
        ruleId: String(ruleId || ''),
        status: String(status || ''),
      },
    });
  }

  async function syncInsightFeishu() {
    return cloudRequest('/insights/feishu-sync', { method: 'POST', body: { version: SCRIPT_VERSION } });
  }

  async function fetchInsightFeishuStatus() {
    return cloudRequest('/insights/feishu-status', { method: 'GET' });
  }

  async function fetchInsightFeishuPreview() {
    return cloudRequest('/insights/feishu-preview', { method: 'GET' });
  }

  async function fetchInsightFeishuTsv() {
    return cloudRequest('/insights/feishu-tsv', { method: 'GET' });
  }

  async function fetchInsightRecommendation(data, productType) {
    const params = new URLSearchParams();
    if (data && data.sku) params.set('sku', data.sku);
    if (productType) params.set('productType', productType);
    if (data && data.name) params.set('name', data.name);
    return cloudRequest('/insights/recommend?' + params.toString(), { method: 'GET' });
  }

  async function fetchLoadingTips() {
    return cloudRequest('/tips', { method: 'GET' });
  }

  async function refreshLoadingTips(showFeedback) {
    try {
      const response = await fetchLoadingTips();
      const tips = normalizeLoadingTips(response && response.tips);
      state.loadingTips = tips;
      state.loadingTipsLoaded = true;
      if (showFeedback) showToast('\u5c0f\u63d0\u793a\u5df2\u5237\u65b0\uff1a' + tips.length + '\u6761');
    } catch (error) {
      state.loadingTips = DEFAULT_LOADING_TIPS.slice();
      state.loadingTipsLoaded = false;
      addLog('warn', '\u5c0f\u63d0\u793a\u62c9\u53d6\u5931\u8d25\uff0c\u5df2\u4f7f\u7528\u672c\u5730\u9ed8\u8ba4\u63d0\u793a', formatErrorMessage(error));
      if (showFeedback) showToast('\u5c0f\u63d0\u793a\u62c9\u53d6\u5931\u8d25\uff0c\u5df2\u4f7f\u7528\u9ed8\u8ba4\u63d0\u793a');
    }
  }

  function openLoadingTipsManager() {
    const url = CLOUD_BACKUP_API_BASE + '/admin';
    window.open(url, '_blank', 'noopener,noreferrer');
    refreshLoadingTips(true);
  }

  function scheduleSizeImageAccessRefresh(delay) {
    if (state.sizeImageAccessTimer) window.clearTimeout(state.sizeImageAccessTimer);
    state.sizeImageAccessTimer = window.setTimeout(() => {
      state.sizeImageAccessTimer = 0;
      refreshSizeImageAccess();
    }, Math.max(0, Number(delay) || 0));
  }

  async function refreshSizeImageAccess() {
    const name = findCurrentPlmUserName();
    if (!name) {
      state.sizeImageAccessEnabled = false;
      state.sizeImageAccessLoading = true;
      scheduleSizeImageAccessRefresh(1500);
      return;
    }
    state.sizeImageAccessName = name;
    state.sizeImageAccessLoading = true;
    if (state.view === 'home') renderShell();
    try {
      const response = await cloudRequest('/features/size-image?name=' + encodeURIComponent(name), { method: 'GET' });
      if (state.sizeImageAccessName !== name) return;
      state.sizeImageAccessEnabled = Boolean(response && response.enabled);
    } catch (error) {
      state.sizeImageAccessEnabled = false;
      addLog('warn', '生成尺寸图权限检查失败', formatErrorMessage(error));
    } finally {
      state.sizeImageAccessLoading = false;
      if (state.view === 'home') renderShell();
    }
  }

  function cloudRequest(path, options) {
    const method = (options && options.method) || 'GET';
    const body = options && options.body ? JSON.stringify(options.body) : null;
    const url = CLOUD_BACKUP_API_BASE + path;
    const timeoutMs = Number(options && options.timeoutMs) || 30000;
    return new Promise((resolve, reject) => {
      const handleLoad = (response) => {
        const text = response.responseText || '';
        let data = null;
        try {
          data = text ? JSON.parse(text) : {};
        } catch (error) {
          if (response.status >= 200 && response.status < 300 && path === '/backup/save') {
            resolve({ ok: true, responseFormat: 'html' });
            return;
          }
          reject(new Error('云端返回了非 JSON 响应（HTTP ' + response.status + '）'));
          return;
        }
        if (response.status < 200 || response.status >= 300) {
          reject(buildCloudError(data, response.status));
          return;
        }
        resolve(data);
      };
      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({
          method,
          url,
          headers: {
            'content-type': 'application/json',
            'x-api-key': CLOUD_BACKUP_API_KEY,
          },
          data: body,
          onload: handleLoad,
          onerror: () => reject(new Error('云端请求被浏览器拦截或网络不可用')),
          ontimeout: () => reject(new Error('timeout')),
          timeout: timeoutMs,
        });
        return;
      }
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : null;
      fetch(url, {
        method,
        signal: controller ? controller.signal : undefined,
        headers: {
          'content-type': 'application/json',
          'x-api-key': CLOUD_BACKUP_API_KEY,
        },
        body,
      }).then(async (response) => {
        const text = await response.text();
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch (error) {
          if (response.ok && path === '/backup/save') return { ok: true, responseFormat: 'html' };
          throw new Error('云端返回了非 JSON 响应（HTTP ' + response.status + '）');
        }
        if (!response.ok) throw buildCloudError(data, response.status);
        return data;
      }).then(resolve, (error) => {
        reject(error && error.name === 'AbortError' ? new Error('timeout') : error);
      }).finally(() => {
        if (timer) window.clearTimeout(timer);
      });
    });
  }

  function buildCloudError(data, status) {
    const error = new Error(formatCloudError(data, status));
    error.cloudData = data || {};
    error.status = status;
    return error;
  }

  function formatCloudError(data, status) {
    const parts = [];
    if (data && data.error) parts.push(data.error);
    if (data && data.message) parts.push(data.message);
    if (data && data.warning) parts.push(data.warning);
    return parts.filter(Boolean).join('\uff1a') || ('HTTP ' + status);
  }

  function formatErrorMessage(error) {
    return error && error.message ? error.message : String(error || '\u672a\u77e5\u9519\u8bef');
  }

  function isRecoverableFeishuSyncError(error) {
    const data = error && error.cloudData || {};
    const message = formatErrorMessage(error);
    return /FEISHU_.*not configured|not configured|feishu table missing required fields|missing required fields|missing fields|fields check failed/i.test(message) ||
      Array.isArray(data.missingFields) ||
      Array.isArray(data.tableMissingFields);
  }

  function formatFeishuSyncErrorDetail(error) {
    const data = error && error.cloudData || {};
    const fields = []
      .concat(Array.isArray(data.missingFields) ? data.missingFields : [])
      .concat(Array.isArray(data.tableMissingFields) ? data.tableMissingFields : []);
    const uniqueFields = fields.filter((field, index) => field && fields.indexOf(field) === index);
    const parts = [formatErrorMessage(error)];
    if (uniqueFields.length) parts.push('\u7f3a\u5b57\u6bb5 ' + uniqueFields.join('/'));
    return parts.filter(Boolean).join(' / ');
  }

  function formatCopyAll(data) {
    if (!data) return '';
    return [
      '[' + L.fileSection + ']',
      L.brand + ' / ' + L.name + ' / ' + L.sku + ': ' + [data.brand, data.name, data.sku].filter(Boolean).join(' | '),
      L.packageCode + ': ' + (data.packageCode || L.unknown),
      L.printCode + ': ' + (data.printCode || L.unknown),
      (data.packageSizeLabel || L.packageSize) + ': ' + (data.packageSizeText || L.noPackage),
      (data.printSizeLabel || L.printSize) + ': ' + (data.printSizeText || L.noPrint),
      '',
      '[' + L.graphicSection + ']',
      L.cartonLength + ': ' + (data.packageLength || L.noDimension),
      L.cartonWidth + ': ' + (data.packageWidth || L.noDimension),
      L.cartonHeight + ': ' + (data.packageHeight || L.noDimension),
      L.productLength + ': ' + (data.isTubePrint ? (data.productLength || L.tailSealLength) : (data.productLength || L.noDimension)),
      L.productWidth + ': ' + (data.productWidth || L.noDimension),
      L.productHeight + ': ' + (data.productHeight || L.noDimension),
      L.netContent + ': ' + (data.netContent || L.unknown),
      L.grossWeight + ': ' + (data.grossWeight || L.unknown),
    ].join('\n');
  }

  function formatTitleMeta(data) {
    if (!data) return '';
    return [data.brand, data.name, data.sku].filter(Boolean).join(' ');
  }

  function copyText(text) {
    const value = text || L.unknown;
    if (typeof GM_setClipboard === 'function') GM_setClipboard(value, 'text');
    else if (navigator.clipboard) navigator.clipboard.writeText(value);
  }

  function showToast(text) {
    const panel = ensurePanel();
    const noteToast = panel.querySelector('.pfh-note-toast');
    if (noteToast) {
      noteToast.textContent = text || '';
      noteToast.classList.toggle('is-visible', Boolean(text));
      clearTimeout(state.toastTimer);
      state.toastTimer = setTimeout(() => {
        noteToast.textContent = '';
        noteToast.classList.remove('is-visible');
      }, String(text || '').length > 12 ? 12000 : 7000);
      return;
    }
    let toast = panel.querySelector('.pfh-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'pfh-toast';
      panel.appendChild(toast);
    }
    toast.textContent = text;
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.remove(), String(text || '').length > 12 ? 12000 : 7000);
  }

  function addLog(level, message, detail) {
    const text = [message, detail].filter(Boolean).join(' | ');
    const item = {
      time: new Date().toLocaleTimeString(),
      level: level || 'info',
      message: String(text || '').slice(0, 600),
    };
    state.logs = [item].concat(state.logs || []).slice(0, 300);
    saveLogs();
    syncImportantLog(item, detail);
    const panel = document.getElementById(PANEL_ID);
    if (panel && panel.dataset.view === 'about') {
      const logPanel = panel.querySelector('.pfh-log-panel');
      if (logPanel) logPanel.outerHTML = renderLogSection();
    }
  }

  function loadLogs() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(LOG_KEY, null) : JSON.parse(localStorage.getItem(LOG_KEY) || 'null');
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function saveLogs() {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(LOG_KEY, state.logs || []);
      else localStorage.setItem(LOG_KEY, JSON.stringify(state.logs || []));
    } catch (error) {
      console.warn('PLM floating helper log save failed:', error);
    }
  }

  function formatLogsForCopy() {
    return (state.logs || []).map((item) => '[' + (item.time || '') + '] ' + (item.level || 'info').toUpperCase() + ' ' + (item.message || '')).join('\n') || L.logEmpty;
  }

  function syncImportantLog(item, detail) {
    const level = String(item && item.level || '').toLowerCase();
    if (!/^(success|warn|error)$/.test(level)) return;
    const message = String(item && item.message || '');
    if (!message || shouldSkipCloudLogSync(level, message)) return;
    const now = Date.now();
    const key = [level, message.slice(0, 180)].join('|');
    state.logSyncDedup = state.logSyncDedup || {};
    if (state.logSyncDedup[key] && now - state.logSyncDedup[key] < 5 * 60 * 1000) return;
    state.logSyncDedup[key] = now;
    const data = state.data || (state.selectedSku ? loadData(state.selectedSku) : null) || {};
    const logSku = findSku([message, detail].filter(Boolean).join(' '));
    syncInsightEvent('log', {
      sku: logSku || data.sku || state.selectedSku || state.sku || '',
      brand: logSku && logSku !== data.sku ? '' : (data.brand || ''),
      name: logSku && logSku !== data.sku ? '' : (data.name || ''),
      level,
      message,
      detail: String(detail || '').slice(0, 600),
      url: location.href,
      source: 'plm-helper-log',
    });
  }

  function shouldSkipCloudLogSync(level, message) {
    const text = String(message || '');
    if (/\u4e91\u7aef\u6d1e\u5bdf\u540c\u6b65\u5931\u8d25|\u4e91\u5907\u4efd/.test(text)) return true;
    if (level === 'success' && !/(\u63d0\u5ba1|\u4e0a\u4f20|\u751f\u6210|Excel|\u6807\u7b7e|\u590d\u5236|AI|\u98de\u4e66|\u6e05\u6d17|\u667a\u80fd|\u4ef7\u683c|\u7c7b\u578b|\u6570\u636e|\u56fe\u7247)/i.test(text)) return true;
    if (/^\u56fe\u7247\u4e0b\u8f7d\u6210\u529f/.test(text)) return true;
    if (/^\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1aURL \u515c\u5e95\u4e0b\u8f7d/.test(text)) return true;
    return false;
  }

  function emptyInsights() {
    return { priceHistory: [], dataIssues: [], typeStats: {} };
  }

  function sanitizeInsights(value) {
    const source = value && typeof value === 'object' ? value : {};
    const clean = emptyInsights();
    clean.priceHistory = (Array.isArray(source.priceHistory) ? source.priceHistory : []).slice(0, 1000).map((item) => ({
      sku: String(item.sku || '').slice(0, 80),
      brand: String(item.brand || '').slice(0, 120),
      name: String(item.name || '').slice(0, 200),
      productType: String(item.productType || '').slice(0, 120),
      price: String(item.price || '').slice(0, 40),
      packQty: String(item.packQty || '').slice(0, 40),
      packageSize: String(item.packageSize || '').slice(0, 120),
      productSize: String(item.productSize || '').slice(0, 120),
      source: String(item.source || '').slice(0, 80),
      fileName: String(item.fileName || '').slice(0, 220),
      recordedAt: String(item.recordedAt || '').slice(0, 80),
      recordedAtMs: Number(item.recordedAtMs || 0) || 0,
    })).filter((item) => item.sku);
    clean.dataIssues = (Array.isArray(source.dataIssues) ? source.dataIssues : []).slice(0, 1000).map((item) => ({
      sku: String(item.sku || '').slice(0, 80),
      brand: String(item.brand || '').slice(0, 120),
      name: String(item.name || '').slice(0, 200),
      missing: Array.isArray(item.missing) ? item.missing.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 20) : [],
      seen: String(item.seen || '').slice(0, 120),
      issueKind: String(item.issueKind || '').slice(0, 80),
      readiness: String(item.readiness || '').slice(0, 160),
      diagnosticAttempt: sanitizeMissingDiagnostic(item.diagnosticAttempt),
      fieldDiagnostics: sanitizeFieldDiagnostics(item.fieldDiagnostics),
      source: String(item.source || '').slice(0, 80),
      recordedAt: String(item.recordedAt || '').slice(0, 80),
      recordedAtMs: Number(item.recordedAtMs || 0) || 0,
    })).filter((item) => item.sku && item.missing.length);
    const stats = source.typeStats && typeof source.typeStats === 'object' ? source.typeStats : {};
    Object.keys(stats).slice(0, 300).forEach((key) => {
      const item = stats[key] || {};
      clean.typeStats[String(key).slice(0, 120)] = {
        count: Number(item.count || 0) || 0,
        latestSku: String(item.latestSku || '').slice(0, 80),
        latestPrice: String(item.latestPrice || '').slice(0, 40),
        latestAt: String(item.latestAt || '').slice(0, 80),
      };
    });
    return clean;
  }

  function sanitizeFieldDiagnostics(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, 20).map((item) => ({
      field: String(item && item.field || '').slice(0, 80),
      targetTab: String(item && item.targetTab || '').slice(0, 80),
      tabRead: Boolean(item && item.tabRead),
      issueKind: String(item && item.issueKind || '').slice(0, 80),
      action: String(item && item.action || '').slice(0, 120),
    })).filter((item) => item.field);
  }

  function loadInsights() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(INSIGHTS_KEY, null) : JSON.parse(localStorage.getItem(INSIGHTS_KEY) || 'null');
      return sanitizeInsights(saved);
    } catch (error) {
      return emptyInsights();
    }
  }

  function saveInsights() {
    try {
      state.insights = sanitizeInsights(state.insights);
      if (typeof GM_setValue === 'function') GM_setValue(INSIGHTS_KEY, state.insights);
      else localStorage.setItem(INSIGHTS_KEY, JSON.stringify(state.insights));
    } catch (error) {
      console.warn('PLM floating helper insights save failed:', error);
    }
  }

  function getProductTypeForInsight(data, extra) {
    if (data && data.aiProductType && !/^\u672a\u5206\u7c7b$/i.test(String(data.aiProductType))) return String(data.aiProductType);
    const text = [
      extra && extra.englishName,
      extra && extra.chineseName,
      data && data.name,
      data && data.netContent,
    ].filter(Boolean).join(' ');
    const ruleMatch = matchClassificationRules(data, state.classificationRules || [], 'category');
    if (ruleMatch && ruleMatch.label) return ruleMatch.label;
    if (/(?:\u80f6\u56ca|capsule)\s*(?:\u9762\u971c|cream)|(?:\u9762\u971c|cream)\s*(?:\u80f6\u56ca|capsule)/i.test(text)) return '\u9762\u971c';
    if (/\u8f6f\u7cd6|gumm/i.test(text)) return '\u8f6f\u7cd6';
    if (/\u7cbe\u6cb9|oil/i.test(text)) return '\u7cbe\u6cb9';
    if (/\u9762\u971c|face\s*cream/i.test(text)) return '\u9762\u971c';
    if (/\u80f6\u56ca|capsule/i.test(text)) return '\u80f6\u56ca';
    if (/\u971c|cream/i.test(text)) return '\u971c\u7c7b';
    if (/\u9999\u6c34|perfume/i.test(text)) return '\u9999\u6c34';
    if (/\u73a9\u5177|toy|\u516c\u4ed4|\u634f\u634f/i.test(text)) return '\u73a9\u5177';
    return '\u672a\u5206\u7c7b';
  }

  function getClassificationText(data) {
    return [
      data && data.sku,
      data && data.brand,
      data && data.name,
      data && data.netContent,
      data && data.packageSizeLabel,
      data && data.packageSizeText,
      data && data.printSizeLabel,
      data && data.printSizeText,
      data && data.logoText,
      data && data.aiProductType,
      data && data.aiCategory,
      Array.isArray(data && data.aiPackageTypes) ? data.aiPackageTypes.join(' ') : '',
    ].filter(Boolean).join(' ').toLowerCase();
  }

  function normalizeRuleKeywords(value) {
    if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return normalizeRuleKeywords(parsed);
      } catch (error) {
        return value.split(/[,，/、\s]+/).map((item) => item.trim()).filter(Boolean);
      }
    }
    return [];
  }

  function matchClassificationRules(data, rules, kind) {
    const text = getClassificationText(data);
    if (!text) return null;
    const scored = (Array.isArray(rules) ? rules : [])
      .filter((rule) => !kind || rule.kind === kind)
      .map((rule) => {
        const keywords = normalizeRuleKeywords(rule.keywords);
        const negative = normalizeRuleKeywords(rule.negativeKeywords);
        if (!keywords.length || negative.some((kw) => kw && text.includes(kw.toLowerCase()))) return null;
        const hits = keywords.filter((kw) => kw && text.includes(kw.toLowerCase()));
        if (!hits.length) return null;
        const confidence = Number(rule.confidence || 0.65) || 0.65;
        return { rule, hits, score: hits.reduce((sum, kw) => {
          const length = Math.min(String(kw).length, 24);
          return sum + length * length;
        }, 0) * confidence };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
    return scored[0] ? { ...scored[0].rule, hits: scored[0].hits, score: scored[0].score } : null;
  }

  function matchPackageTypeRules(data, rules) {
    const matches = (Array.isArray(rules) ? rules : [])
      .filter((rule) => rule.kind === 'packageType')
      .map((rule) => matchClassificationRules(data, [rule], 'packageType'))
      .filter(Boolean)
      .sort((a, b) => (Number(b.score || 0) - Number(a.score || 0)));
    const seen = new Set();
    return matches.filter((item) => {
      const label = item.label || '';
      if (!label || seen.has(label)) return false;
      seen.add(label);
      return true;
    }).slice(0, 6);
  }

  function applyClassificationRulesToLocalCache(rules) {
    const usable = Array.isArray(rules) ? rules : [];
    if (!usable.length) throw new Error('\u6682\u65e0\u53ef\u7528\u5206\u7c7b\u89c4\u5219');
    let total = 0;
    let updated = 0;
    const now = new Date().toLocaleString();
    (state.index || []).forEach((item) => {
      const sku = item && item.sku;
      if (!sku) return;
      const data = normalizeData(loadData(sku) || item);
      if (!data || !data.sku) return;
      const explicitType = String(data.aiProductType || data.aiCategory || '').trim();
      if (explicitType && !/^\u672a\u5206\u7c7b$/i.test(explicitType)) return;
      total += 1;
      const category = matchClassificationRules(data, usable, 'category');
      const packageTypes = matchPackageTypeRules(data, usable);
      const next = { ...data };
      let changed = false;
      if (category && category.label && next.aiProductType !== category.label) {
        next.aiProductType = category.label;
        next.aiCategory = category.label;
        next.aiCategoryRule = category.ruleId || '';
        changed = true;
      }
      const packageLabels = packageTypes.map((rule) => rule.label).filter(Boolean);
      if (packageLabels.length && JSON.stringify(next.aiPackageTypes || []) !== JSON.stringify(packageLabels)) {
        next.aiPackageTypes = packageLabels;
        next.aiPackageRuleIds = packageTypes.map((rule) => rule.ruleId || '').filter(Boolean);
        changed = true;
      }
      if (changed) {
        next.aiClassifiedAt = now;
        saveDataDirect(sku, normalizeData(next));
        upsertIndex(next);
        updated += 1;
      }
    });
    saveIndex();
    if (state.selectedSku) {
      const current = loadData(state.selectedSku);
      if (current) state.data = normalizeData(current);
    }
    return { total, updated };
  }

  function formatClassificationRulesForCopy(rules) {
    const lines = ['类型\t名称\t置信度\t关键词\t排除词\t样例\t来源\t更新时间'];
    (Array.isArray(rules) ? rules : []).forEach((rule) => {
      lines.push([
        rule.kind === 'packageType' ? '包材' : '品类',
        rule.label || '',
        rule.confidence || '',
        normalizeRuleKeywords(rule.keywords).join('/'),
        normalizeRuleKeywords(rule.negativeKeywords).join('/'),
        normalizeRuleKeywords(rule.examples).join('/'),
        rule.source || '',
        rule.updatedAt || '',
      ].join('\t'));
    });
    return lines.join('\n');
  }

  function compactSizeForInsight(parts, fallback) {
    const text = Array.isArray(parts) ? parts.filter(Boolean).join('x') : '';
    return text || String(fallback || '');
  }

  function recordCommerceInsight(data, extra, options) {
    if (!data || !data.sku) return;
    const insight = state.insights || emptyInsights();
    const productType = getProductTypeForInsight(data, extra);
    const item = {
      sku: data.sku,
      brand: data.brand || '',
      name: data.name || (extra && extra.chineseName) || '',
      productType,
      price: String(options && options.price || ''),
      packQty: String(options && options.packQty || ''),
      packageSize: compactSizeForInsight([data.packageLength, data.packageWidth, data.packageHeight], data.packageSizeText),
      productSize: compactSizeForInsight([data.productLength, data.productWidth, data.productHeight], data.productNums),
      source: options && options.source || 'manual',
      fileName: options && options.fileName || '',
      recordedAt: new Date().toLocaleString(),
      recordedAtMs: Date.now(),
    };
    insight.priceHistory = [item].concat(insight.priceHistory || []).slice(0, 1000);
    const stat = insight.typeStats[productType] || { count: 0 };
    insight.typeStats[productType] = {
      count: Number(stat.count || 0) + 1,
      latestSku: data.sku,
      latestPrice: item.price,
      latestAt: item.recordedAt,
    };
    state.insights = insight;
    saveInsights();
    addLog('success', '\u5df2\u8bb0\u5f55\u4ef7\u683c/\u7c7b\u578b\u5386\u53f2', data.sku + ' ' + productType + ' ' + item.price);
    syncInsightEvent('price', item);
    queueCloudBackup();
  }

  function recordDataQuality(data, source) {
    if (!data || !data.sku) return;
    const missing = getMissingFieldsForData(data);
    if (!missing.length) return;
    const seen = [
      data.seenMaterial ? '\u7269\u6599' : '',
      data.seenProduct ? '\u4ea7\u54c1' : '',
      data.seenDesign ? '\u8bbe\u8ba1' : '',
    ].filter(Boolean).join('/');
    const issueMeta = getDataQualityIssueMeta(data, missing);
    const item = {
      sku: data.sku,
      brand: data.brand || '',
      name: data.name || '',
      missing,
      seen,
      issueKind: issueMeta.kind,
      readiness: issueMeta.readiness,
      diagnosticAttempt: issueMeta.diagnosticAttempt,
      fieldDiagnostics: issueMeta.fieldDiagnostics,
      source: source || 'scan',
      recordedAt: new Date().toLocaleString(),
      recordedAtMs: Date.now(),
    };
    const insight = state.insights || emptyInsights();
    const exists = (insight.dataIssues || []).some((old) => old.sku === item.sku && old.missing.join(',') === item.missing.join(',') && Date.now() - Number(old.recordedAtMs || 0) < 10 * 60 * 1000);
    if (!exists) {
      insight.dataIssues = [item].concat(insight.dataIssues || []).slice(0, 1000);
      state.insights = insight;
      saveInsights();
      addLog('warn', '\u6570\u636e\u7f3a\u5931', data.sku + ' \u7f3a\uff1a' + missing.join('\u3001') + (seen ? ' / \u5df2\u8bfb\uff1a' + seen : '') + ' / ' + issueMeta.kind);
      syncInsightEvent('issue', {
        ...item,
        missingFields: item.missing,
        diagnosticAttempt: item.diagnosticAttempt,
        fieldDiagnostics: item.fieldDiagnostics,
      });
    }
  }

  function getMissingFieldsForData(data) {
    const missing = [];
    if (!data) return missing;
    if (!data.brand) missing.push('\u54c1\u724c');
    if (!data.name) missing.push('\u5546\u54c1\u540d\u79f0');
    if (!data.packageSizeText && !(data.packageLength && data.packageWidth && data.packageHeight)) missing.push('\u5305\u88c5\u5c3a\u5bf8');
    if (!data.printSizeText) missing.push('\u5370\u5237\u5c3a\u5bf8');
    if (!data.productLength || !data.productWidth || !data.productHeight) missing.push('\u4ea7\u54c1\u5c3a\u5bf8');
    if (!data.netContent) missing.push('\u51c0\u542b\u91cf');
    if (!data.grossWeight) missing.push('\u6bdb\u91cd');
    if (data.seenDesign && !getProductThumbUrl(data)) missing.push('SKU\u56fe');
    return missing;
  }

  function getDataQualityIssueMeta(data, missing) {
    const readTabs = [
      data.seenMaterial ? '\u7269\u6599\u6e05\u5355' : '',
      data.seenProduct ? '\u4ea7\u54c1\u4fe1\u606f' : '',
      data.seenDesign ? '\u8bbe\u8ba1\u8d44\u6599' : '',
    ].filter(Boolean);
    const allCoreTabsRead = Boolean(data.seenMaterial && data.seenProduct);
    const materialFields = ['\u5305\u88c5\u5c3a\u5bf8', '\u5370\u5237\u5c3a\u5bf8', '\u51c0\u542b\u91cf'];
    const productFields = ['\u4ea7\u54c1\u5c3a\u5bf8', '\u6bdb\u91cd'];
    const designFields = ['SKU\u56fe'];
    const projectFields = ['\u54c1\u724c', '\u5546\u54c1\u540d\u79f0'];
    const missingMaterial = missing.some((field) => materialFields.includes(field));
    const missingProduct = missing.some((field) => productFields.includes(field));
    const missingDesign = missing.some((field) => designFields.includes(field));
    const missingProject = missing.some((field) => projectFields.includes(field));
    const targetTabUnread = (missingMaterial && !data.seenMaterial) || (missingProduct && !data.seenProduct) || (missingDesign && !data.seenDesign);
    let kind = '\u53ef\u80fd PLM \u7a7a\u503c';
    if (targetTabUnread || !readTabs.length) {
      kind = '\u9875\u9762\u672a\u8bfb\u5b8c';
    } else if (missingProject || (missingMaterial && data.seenMaterial) || (missingProduct && data.seenProduct) || (missingDesign && data.seenDesign) || allCoreTabsRead) {
      kind = '\u9875\u9762\u5df2\u8bfb\u4f46\u672a\u89e3\u6790';
    }
    const diagnosticAttempt = sanitizeMissingDiagnostic(data.lastMissingDiagnostic);
    const fieldDiagnostics = missing.map((field) => buildFieldDiagnostic(data, field, diagnosticAttempt));
    return {
      kind,
      readiness: (readTabs.length ? '\u5df2\u8bfb\u9875\u7b7e\uff1a' + readTabs.join('/') : '\u672a\u8bfb\u5230\u6838\u5fc3\u9875\u7b7e') + formatDiagnosticReadinessSuffix(diagnosticAttempt),
      diagnosticAttempt,
      fieldDiagnostics,
    };
  }

  function buildFieldDiagnostic(data, field, diagnosticAttempt) {
    const targetTab = getMissingFieldTargetTab(field);
    const tabRead = targetTab === '\u9879\u76ee\u8be6\u60c5'
      ? Boolean(data.sku)
      : (targetTab === '\u7269\u6599\u6e05\u5355'
      ? Boolean(data.seenMaterial)
      : (targetTab === '\u4ea7\u54c1\u4fe1\u606f' ? Boolean(data.seenProduct) : (targetTab === '\u8bbe\u8ba1\u8d44\u6599' ? Boolean(data.seenDesign) : false)));
    const issueKind = tabRead ? '\u9875\u9762\u5df2\u8bfb\u4f46\u672a\u89e3\u6790' : '\u9875\u9762\u672a\u8bfb\u5b8c';
    const retryText = formatFieldRetryAction(field, diagnosticAttempt);
    return {
      field,
      targetTab,
      tabRead,
      issueKind,
      action: (tabRead
        ? '\u8865\u5145\u201c' + field + '\u201d\u7684\u9009\u62e9\u5668\u6216\u89e3\u6790\u89c4\u5219'
        : '\u5148\u68c0\u67e5\u201c' + (targetTab || '\u5bf9\u5e94') + '\u201d\u533a\u57df\u662f\u5426\u6210\u529f\u6253\u5f00\u5e76\u52a0\u8f7d') + retryText,
    };
  }

  function sanitizeMissingDiagnostic(value) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      status: String(source.status || '').slice(0, 40),
      reason: String(source.reason || '').slice(0, 160),
      beforeMissing: Array.isArray(source.beforeMissing) ? source.beforeMissing.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 20) : [],
      afterMissing: Array.isArray(source.afterMissing) ? source.afterMissing.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 20) : [],
      fixed: Array.isArray(source.fixed) ? source.fixed.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 20) : [],
      tabs: Array.isArray(source.tabs) ? source.tabs.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 8) : [],
      attempts: sanitizeDiagnosticAttempts(source.attempts),
      elapsedMs: Number(source.elapsedMs || 0) || 0,
      at: String(source.at || '').slice(0, 80),
    };
  }

  function formatDiagnosticReadinessSuffix(diagnostic) {
    if (!diagnostic || !diagnostic.status) return '';
    const parts = ['\u4e8c\u6b21\u8bfb\u53d6\uff1a' + diagnostic.status];
    if (diagnostic.tabs && diagnostic.tabs.length) parts.push('\u9875\u7b7e ' + diagnostic.tabs.join('/'));
    if (diagnostic.attempts && diagnostic.attempts.length) parts.push('\u5c1d\u8bd5 ' + diagnostic.attempts.map((item) => item.tab + 'x' + item.count).join('/'));
    if (diagnostic.elapsedMs) parts.push(trimNumber(diagnostic.elapsedMs / 1000) + 's');
    if (diagnostic.reason) parts.push(diagnostic.reason);
    return ' / ' + parts.join(' / ');
  }

  function formatFieldRetryAction(field, diagnostic) {
    if (!diagnostic || !diagnostic.status) return '';
    if (diagnostic.fixed && diagnostic.fixed.includes(field)) return '\uff1b\u4e8c\u6b21\u8bfb\u53d6\u5df2\u8865\u5230';
    if (diagnostic.afterMissing && diagnostic.afterMissing.includes(field)) {
      return '\uff1b\u4e8c\u6b21\u8bfb\u53d6\u540e\u4ecd\u7f3a\uff1a' + (diagnostic.reason || diagnostic.status);
    }
    return '\uff1b\u4e8c\u6b21\u8bfb\u53d6\uff1a' + diagnostic.status;
  }

  function getMissingFieldTargetTab(field) {
    if (field === '\u5305\u88c5\u5c3a\u5bf8' || field === '\u5370\u5237\u5c3a\u5bf8' || field === '\u51c0\u542b\u91cf') return '\u7269\u6599\u6e05\u5355';
    if (field === '\u54c1\u724c' || field === '\u5546\u54c1\u540d\u79f0') return '\u9879\u76ee\u8be6\u60c5';
    if (field === '\u4ea7\u54c1\u5c3a\u5bf8' || field === '\u6bdb\u91cd') return '\u4ea7\u54c1\u4fe1\u606f';
    if (field === 'SKU\u56fe') return '\u8bbe\u8ba1\u8d44\u6599';
    return '';
  }

  function normalizeFieldLabel(text) {
    return compactLabel(text).replace(/[:\uff1a]\s*$/g, '').trim();
  }

  function loadIndex() {
    try {
      if (typeof GM_getValue === 'function') return GM_getValue(STORAGE_INDEX_KEY, []);
      const raw = localStorage.getItem(STORAGE_INDEX_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  }

  function saveIndex() {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(STORAGE_INDEX_KEY, state.index);
      else localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(state.index));
    } catch (error) {
      console.warn('PLM floating helper index save failed:', error);
    }
  }

  function loadSettings() {
    const defaults = { excelKeywordMode: 'english', excelDownloadMode: 'picker', backgroundNoticeSeen: false, collectionEnabled: true, insightAiModel: 'glm-4.7-flash' };
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(SETTINGS_KEY, null) : JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
      return { ...defaults, ...(saved || {}) };
    } catch (error) {
      return defaults;
    }
  }

  function saveSettings(settings) {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(SETTINGS_KEY, settings);
      else localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('PLM floating helper settings save failed:', error);
    }
  }

  function loadTutorialSeen() {
    try {
      return Boolean(typeof GM_getValue === 'function' ? GM_getValue(TUTORIAL_SEEN_KEY, false) : JSON.parse(localStorage.getItem(TUTORIAL_SEEN_KEY) || 'false'));
    } catch (error) {
      return false;
    }
  }

  function saveTutorialSeen(value) {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(TUTORIAL_SEEN_KEY, Boolean(value));
      else localStorage.setItem(TUTORIAL_SEEN_KEY, JSON.stringify(Boolean(value)));
    } catch (error) {
      console.warn('PLM floating helper tutorial flag save failed:', error);
    }
  }

  function loadUploadQueue() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(UPLOAD_QUEUE_KEY, null) : JSON.parse(localStorage.getItem(UPLOAD_QUEUE_KEY) || 'null');
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function saveUploadQueue() {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(UPLOAD_QUEUE_KEY, state.uploadQueue);
      else localStorage.setItem(UPLOAD_QUEUE_KEY, JSON.stringify(state.uploadQueue));
    } catch (error) {
      console.warn('PLM floating helper upload queue save failed:', error);
    }
  }

  function loadUploadHistory() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(UPLOAD_HISTORY_KEY, null) : JSON.parse(localStorage.getItem(UPLOAD_HISTORY_KEY) || 'null');
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function saveUploadHistory() {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(UPLOAD_HISTORY_KEY, state.uploadHistory);
      else localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(state.uploadHistory));
    } catch (error) {
      console.warn('PLM floating helper upload history save failed:', error);
    }
  }

  function moveCompletedUploadsToHistory() {
    const latestQueue = loadUploadQueue();
    const latestHistory = loadUploadHistory();
    const queueSource = latestQueue.length ? latestQueue : (state.uploadQueue || []);
    const completed = queueSource.filter((item) => /\u6210\u529f/.test(item.status || ''));
    if (!completed.length) return;
    const existingIds = new Set(latestHistory.filter(isUploadHistorySuccess).map(uploadHistoryKey));
    const additions = completed.map((item) => ({
      ...item,
      status: item.kind === 'toy-label' ? '\u6807\u7b7e\u4e0a\u4f20\u6210\u529f' : (item.status || L.uploadSuccess),
      step: item.kind === 'toy-label' ? '\u6807\u7b7e\u4e0a\u4f20\u6210\u529f' : item.step,
      completedAt: item.completedAt || item.updatedAt || new Date().toLocaleString(),
      xlsxKey: '',
      zipKey: '',
    })).filter((item) => !existingIds.has(uploadHistoryKey(item)));
    const archivedKeys = new Set(completed.map(uploadHistoryKey));
    state.uploadQueue = queueSource.filter((item) => !/\u6210\u529f/.test(item.status || '') && !archivedKeys.has(uploadHistoryKey(item)));
    state.uploadHistory = additions.concat(latestHistory).slice(0, 200);
    completed.forEach(cleanupUploadFiles);
    saveUploadHistory();
    saveUploadQueue();
  }

  function archiveUploadItem(item) {
    const completedAt = new Date().toLocaleString();
    const latestQueue = loadUploadQueue();
    const latestHistory = loadUploadHistory();
    const latestItem = latestQueue.find((entry) => entry.id === item.id) || item;
    const successText = latestItem.kind === 'toy-label' ? '\u6807\u7b7e\u4e0a\u4f20\u6210\u529f' : L.uploadSuccess;
    const archived = { ...latestItem, status: successText, step: successText, completedAt, updatedAt: completedAt, xlsxKey: '', zipKey: '' };
    const archivedKey = uploadHistoryKey(archived);
    state.uploadQueue = latestQueue.filter((entry) => entry.id !== item.id && uploadHistoryKey(entry) !== archivedKey);
    state.uploadHistory = [archived].concat(latestHistory.filter((entry) => uploadHistoryKey(entry) !== archivedKey)).slice(0, 200);
    cleanupUploadFiles(latestItem);
    saveUploadHistory();
    saveUploadQueue();
    if (archived.sku) updateDailyLedgerForSku(archived.sku, { status: '已完成', stage: '完成', note: '上传成功', imagePackState: 'done', imagePackDone: true }, getTodayKey());
    renderShell();
  }

  function archiveUploadFailure(item, status, reason, options) {
    const completedAt = new Date().toLocaleString();
    const latestQueue = loadUploadQueue();
    const latestHistory = loadUploadHistory();
    const latestItem = latestQueue.find((entry) => entry.id === item.id) || item;
    const keepFiles = Boolean(options && options.keepFiles);
    const archived = {
      ...latestItem,
      status: status || L.uploadFailed,
      step: reason || latestItem.step || L.uploadFailed,
      skipReason: reason || latestItem.skipReason || '',
      completedAt,
      updatedAt: completedAt,
      xlsxKey: keepFiles ? (latestItem.xlsxKey || '') : '',
      zipKey: keepFiles ? (latestItem.zipKey || '') : '',
    };
    const archivedKey = uploadHistoryKey(archived);
    state.uploadQueue = latestQueue.filter((entry) => entry.id !== item.id && uploadHistoryKey(entry) !== archivedKey);
    state.uploadHistory = [archived].concat(latestHistory.filter((entry) => uploadHistoryKey(entry) !== archivedKey)).slice(0, 200);
    if (!keepFiles) cleanupUploadFiles(latestItem);
    saveUploadHistory();
    saveUploadQueue();
    renderShell();
  }

  function markUploadQueueBlocked(item, status, reason, extra) {
    const latestQueue = loadUploadQueue();
    const latestItem = latestQueue.find((entry) => entry.id === item.id) || item;
    const updatedAt = new Date().toLocaleString();
    const blocked = {
      ...latestItem,
      ...(extra || {}),
      status: status || L.uploadFailed,
      step: reason || latestItem.step || status || L.uploadFailed,
      skipReason: reason || latestItem.skipReason || '',
      forceReplace: false,
      updatedAt,
    };
    Object.assign(item, blocked);
    state.uploadQueue = latestQueue.some((entry) => entry.id === item.id)
      ? latestQueue.map((entry) => entry.id === item.id ? blocked : entry)
      : [blocked].concat(latestQueue);
    saveUploadQueue();
    renderShell();
  }

  function uploadHistoryKey(item) {
    return [item && item.sku, item && item.xlsxName, item && item.zipName].filter(Boolean).join('|') || (item && item.id) || '';
  }

  function isUploadHistorySuccess(item) {
    return /\u6210\u529f/.test(String(item && item.status || ''));
  }

  function loadUploadWorkerRunning() {
    try {
      return Boolean(typeof GM_getValue === 'function' ? GM_getValue(UPLOAD_WORKER_KEY, false) : JSON.parse(localStorage.getItem(UPLOAD_WORKER_KEY) || 'false'));
    } catch (error) {
      return false;
    }
  }

  function saveUploadWorkerRunning(value) {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(UPLOAD_WORKER_KEY, Boolean(value));
      else localStorage.setItem(UPLOAD_WORKER_KEY, JSON.stringify(Boolean(value)));
    } catch (error) {
      console.warn('PLM floating helper upload worker save failed:', error);
    }
  }

  function isUploadWorkerPage() {
    return /[?&]plmUploadWorker=1\b/.test(location.search);
  }

  function loadToyLabelExportManifest() {
    try {
      const saved = typeof GM_getValue === 'function'
        ? GM_getValue(TOY_LABEL_EXPORT_MANIFEST_KEY, null)
        : JSON.parse(localStorage.getItem(TOY_LABEL_EXPORT_MANIFEST_KEY) || 'null');
      return saved && typeof saved === 'object'
        ? { signature: String(saved.signature || ''), files: Array.isArray(saved.files) ? saved.files : [], downloaded: Boolean(saved.downloaded) }
        : { signature: '', files: [], downloaded: false };
    } catch (error) {
      return { signature: '', files: [], downloaded: false };
    }
  }

  function saveToyLabelExportManifest(manifest) {
    const value = {
      signature: String(manifest && manifest.signature || ''),
      files: Array.isArray(manifest && manifest.files) ? manifest.files : [],
      downloaded: Boolean(manifest && manifest.downloaded),
    };
    if (typeof GM_setValue === 'function') GM_setValue(TOY_LABEL_EXPORT_MANIFEST_KEY, value);
    else localStorage.setItem(TOY_LABEL_EXPORT_MANIFEST_KEY, JSON.stringify(value));
  }

  async function clearToyLabelExportManifest(manifest) {
    const current = manifest || loadToyLabelExportManifest();
    await Promise.all((current.files || []).map((entry) => deleteUploadFile(entry.key).catch((error) => {
      console.warn('PLM floating helper toy label staged file cleanup failed:', error);
    })));
    saveToyLabelExportManifest({ signature: '', files: [], downloaded: false });
  }

  async function ensureToyLabelExportRun(signature) {
    const current = loadToyLabelExportManifest();
    const requestedSignature = String(signature || '');
    const previousSkus = new Set(current.signature.split('|').filter(Boolean));
    const requestedSkus = requestedSignature.split('|').filter(Boolean);
    if (current.signature === requestedSignature || (current.files.length && requestedSkus.length && requestedSkus.every((sku) => previousSkus.has(sku)))) return current;
    await clearToyLabelExportManifest(current);
    const next = { signature: requestedSignature, files: [], downloaded: false };
    saveToyLabelExportManifest(next);
    state.toyLabelBatchFiles = [];
    return next;
  }

  async function stageToyLabelBatchFiles(files, signature) {
    const manifest = await ensureToyLabelExportRun(signature);
    for (const file of files || []) {
      if (!file || !file.blob || !file.filename) continue;
      const key = 'toy-label-export:' + Date.now() + ':' + Math.random().toString(36).slice(2);
      await putUploadFile(key, file.blob);
      manifest.files.push({ key, sku: String(file.sku || ''), filename: String(file.filename) });
    }
    manifest.downloaded = false;
    saveToyLabelExportManifest(manifest);
  }

  function openUploadDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(UPLOAD_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(UPLOAD_DB_STORE)) db.createObjectStore(UPLOAD_DB_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function putUploadFile(key, file) {
    const db = await openUploadDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(UPLOAD_DB_STORE, 'readwrite');
      tx.objectStore(UPLOAD_DB_STORE).put(file, key);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  async function getUploadFile(key) {
    const db = await openUploadDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(UPLOAD_DB_STORE, 'readonly');
      const request = tx.objectStore(UPLOAD_DB_STORE).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  function cleanupUploadFiles(item) {
    if (!item) return;
    [item.xlsxKey, item.zipKey].filter(Boolean).forEach((key) => {
      deleteUploadFile(key).catch((error) => console.warn('PLM floating helper upload file cleanup failed:', error));
    });
  }

  async function deleteUploadFile(key) {
    if (!key) return;
    const db = await openUploadDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(UPLOAD_DB_STORE, 'readwrite');
      tx.objectStore(UPLOAD_DB_STORE).delete(key);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  function getSortedIndex() {
    return [...state.index].sort((a, b) => {
      if (a.pinned && b.pinned) return (a.pinOrder || 0) - (b.pinOrder || 0);
      if (a.pinned) return -1;
      if (b.pinned) return 1;
      return (b.updatedAtMs || 0) - (a.updatedAtMs || 0);
    });
  }

  function upsertIndex(data) {
    if (!data || !data.sku) return;
    const item = {
      sku: data.sku,
      brand: cleanName(data.brand || ''),
      name: cleanName(data.name || ''),
      packageCode: data.packageCode || '',
      printCode: data.printCode || '',
      updatedAt: data.updatedAt || new Date().toLocaleString(),
      updatedAtMs: data.updatedAtMs || Date.now(),
    };
    const old = state.index.find((entry) => entry.sku === data.sku);
    if (old && old.pinned) {
      item.pinned = true;
      item.pinOrder = old.pinOrder || Date.now();
    }
    state.index = state.index.filter((entry) => entry.sku !== data.sku);
    state.index.unshift(item);
    saveIndex();
  }

  function promoteIndexItem(sku) {
    const item = state.index.find((entry) => entry.sku === sku);
    if (!item) return;
    item.updatedAt = new Date().toLocaleString();
    item.updatedAtMs = Date.now();
    state.index = state.index.filter((entry) => entry.sku !== sku);
    state.index.unshift(item);
    saveIndex();
  }

  function togglePin(sku) {
    const item = state.index.find((entry) => entry.sku === sku);
    if (!item) return;
    if (item.pinned) {
      delete item.pinned;
      delete item.pinOrder;
    } else {
      item.pinned = true;
      item.pinOrder = Date.now();
    }
    saveIndex();
  }

  function loadData(sku) {
    if (!sku) return null;
    try {
      if (typeof GM_getValue === 'function') return GM_getValue(STORAGE_PREFIX + sku, null);
      const raw = localStorage.getItem(STORAGE_PREFIX + sku);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function saveData(sku, data) {
    if (!sku || !data) return;
    const previous = loadData(sku);
    const previousNormalized = previous ? normalizeData(previous) : null;
    const normalized = normalizeData({ ...data, updatedAt: data.updatedAt || new Date().toLocaleString(), updatedAtMs: data.updatedAtMs || Date.now() });
    try {
      saveDataDirect(sku, normalized);
      const viewingSku = state.selectedSku || (state.data && state.data.sku) || '';
      if (!viewingSku || viewingSku === sku) {
        state.data = normalized;
        state.selectedSku = sku;
      }
      upsertIndex(normalized);
      recordDataQuality(normalized, 'saveData');
      queueCloudBackup();
      const previousPackKey = previousNormalized ? buildPackBoxKey(previousNormalized) : '';
      const nextPackKey = buildPackBoxKey(normalized);
      if (nextPackKey && nextPackKey !== previousPackKey) schedulePackAiEstimate(normalized);
    } catch (error) {
      console.warn('PLM floating helper save failed:', error);
      addLog('error', '\u7f13\u5b58\u5546\u54c1\u5931\u8d25', (sku || '') + ' ' + formatErrorMessage(error));
    }
  }

  function saveDataDirect(sku, data) {
    if (typeof GM_setValue === 'function') GM_setValue(STORAGE_PREFIX + sku, data);
    else localStorage.setItem(STORAGE_PREFIX + sku, JSON.stringify(data));
  }

  function loadPosition() {
    try {
      if (typeof GM_getValue === 'function') return GM_getValue(POSITION_KEY, null);
      const raw = localStorage.getItem(POSITION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function savePosition(pos) {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(POSITION_KEY, pos);
      else localStorage.setItem(POSITION_KEY, JSON.stringify(pos));
    } catch (error) {
      console.warn('PLM floating helper position save failed:', error);
    }
  }

  function applySavedPosition(panel) {
    const pos = loadPosition();
    if (!pos) {
      // Scale Violet's preferred full-screen layout, while clamping it into any smaller viewport.
      const initialWidth = clamp(state.panelSize?.width || 686, 520, Math.min(1180, window.innerWidth - 24));
      const initialHeight = clamp(state.panelSize?.height || 906, 520, getPanelMaxHeight());
      const left = clamp(Math.round(window.innerWidth * INITIAL_LAYOUT.panelLeftRatio), 8, Math.max(8, window.innerWidth - initialWidth - 8));
      const top = clamp(Math.round(window.innerHeight * INITIAL_LAYOUT.panelTopRatio), 8, Math.max(8, window.innerHeight - initialHeight - 8));
      panel.style.right = Math.max(8, window.innerWidth - initialWidth - left) + 'px';
      panel.style.bottom = Math.max(8, window.innerHeight - initialHeight - top) + 'px';
      return;
    }
    if (Number.isFinite(pos.right)) panel.style.right = pos.right + 'px';
    if (Number.isFinite(pos.bottom)) panel.style.bottom = pos.bottom + 'px';
  }

  function getCurrentLayoutSnapshot() {
    const panel = ensurePanel();
    const panelRect = panel.getBoundingClientRect();
    const panelStyle = getComputedStyle(panel);
    const launcher = document.getElementById(LAUNCHER_ID);
    const launcherRect = launcher && launcher.getBoundingClientRect();
    const right = Number.parseFloat(panelStyle.right);
    const bottom = Number.parseFloat(panelStyle.bottom);
    const panelRight = Number.isFinite(right) ? right : Math.max(0, window.innerWidth - panelRect.right);
    const panelBottom = Number.isFinite(bottom) ? bottom : Math.max(0, window.innerHeight - panelRect.bottom);
    const launcherLeft = launcherRect ? Math.round(launcherRect.left) : (loadLauncherPosition()?.left ?? 0);
    const launcherTop = launcherRect ? Math.round(launcherRect.top) : (loadLauncherPosition()?.top ?? 0);
    return [
      'PLM 悬浮助手默认布局',
      '窗口位置：right ' + Math.round(panelRight) + 'px / bottom ' + Math.round(panelBottom) + 'px',
      '窗口尺寸：' + Math.round(panelRect.width) + ' x ' + Math.round(panelRect.height),
      '唤起按钮：left ' + launcherLeft + 'px / top ' + launcherTop + 'px',
      '左右分隔栏：' + Math.round(state.splitWidth) + 'px',
    ].join('\n');
  }

  function positionLauncher(launcher) {
    if (!launcher) return;
    launcher.classList.add('is-floating');
    if (launcher.parentElement !== document.documentElement) document.documentElement.appendChild(launcher);
    const saved = loadLauncherPosition();
    if (saved) {
      launcher.style.left = saved.left + 'px';
      launcher.style.top = saved.top + 'px';
      return;
    }
    const buttonWidth = 86;
    const buttonHeight = 34;
    launcher.style.left = clamp(Math.round(window.innerWidth * INITIAL_LAYOUT.launcherLeftRatio), 8, Math.max(8, window.innerWidth - buttonWidth - 8)) + 'px';
    launcher.style.top = clamp(Math.round(window.innerHeight * INITIAL_LAYOUT.launcherTopRatio), 8, Math.max(8, window.innerHeight - buttonHeight - 8)) + 'px';
  }

  function loadLauncherPosition() {
    try {
      const raw = typeof GM_getValue === 'function' ? GM_getValue(LAUNCHER_POSITION_KEY, null) : JSON.parse(localStorage.getItem(LAUNCHER_POSITION_KEY) || 'null');
      if (!raw || !Number.isFinite(raw.left) || !Number.isFinite(raw.top)) return null;
      return {
        left: clamp(raw.left, 8, Math.max(8, window.innerWidth - 40)),
        top: clamp(raw.top, 8, Math.max(8, window.innerHeight - 24)),
      };
    } catch (error) {
      return null;
    }
  }

  function saveLauncherPosition(pos) {
    const value = {
      left: clamp(pos.left, 8, Math.max(8, window.innerWidth - 40)),
      top: clamp(pos.top, 8, Math.max(8, window.innerHeight - 24)),
    };
    try {
      if (typeof GM_setValue === 'function') GM_setValue(LAUNCHER_POSITION_KEY, value);
      else localStorage.setItem(LAUNCHER_POSITION_KEY, JSON.stringify(value));
    } catch (error) {
      console.warn('PLM floating helper launcher position save failed:', error);
    }
  }

  function loadPanelSize() {
    try {
      const value = typeof GM_getValue === 'function' ? GM_getValue(SIZE_KEY, null) : JSON.parse(localStorage.getItem(SIZE_KEY) || 'null');
      if (value && Number.isFinite(value.width) && Number.isFinite(value.height)) {
        return {
          width: value.width,
          height: value.height,
        };
      }
      return { width: 686, height: Math.min(906, getPanelMaxHeight()) };
    } catch (error) {
      return { width: 686, height: Math.min(906, getPanelMaxHeight()) };
    }
  }

  function savePanelSize(size) {
    const maxHeight = getPanelMaxHeight();
    const value = {
      width: clamp(size.width, 640, Math.min(1180, window.innerWidth - 24)),
      height: clamp(size.height, 520, maxHeight),
    };
    state.panelSize = value;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(SIZE_KEY, value);
      else localStorage.setItem(SIZE_KEY, JSON.stringify(value));
    } catch (error) {
      console.warn('PLM floating helper size save failed:', error);
    }
  }

  function applyPanelSize(panel) {
    if (!state.panelSize) return;
    const height = clamp(state.panelSize.height, 520, getPanelMaxHeight());
    const width = clamp(state.panelSize.width, 520, Math.min(1180, window.innerWidth - 24));
    panel.style.width = width + 'px';
    panel.style.height = height + 'px';
    panel.style.maxHeight = getPanelMaxHeight() + 'px';
    panel.classList.toggle('is-narrow-panel', width < 920);
    const main = panel.querySelector('.pfh-main');
    if (main) main.style.height = 'auto';
  }

  function getPanelMaxHeight() {
    return Math.max(520, Math.floor(window.innerHeight * 0.96));
  }

  function loadSplitWidth() {
    try {
      const value = typeof GM_getValue === 'function' ? GM_getValue(SPLIT_KEY, INITIAL_LAYOUT.splitWidth) : Number(localStorage.getItem(SPLIT_KEY) || INITIAL_LAYOUT.splitWidth);
      return clamp(Number(value) || INITIAL_LAYOUT.splitWidth, 110, 260);
    } catch (error) {
      return INITIAL_LAYOUT.splitWidth;
    }
  }

  function saveSplitWidth(width) {
    const value = clamp(width, 110, 260);
    state.splitWidth = value;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(SPLIT_KEY, value);
      else localStorage.setItem(SPLIT_KEY, String(value));
    } catch (error) {
      console.warn('PLM floating helper split save failed:', error);
    }
  }

  function applySplitWidth(panel) {
    const main = panel.querySelector('.pfh-main');
    if (main) main.style.setProperty('--pfh-list-width', state.splitWidth + 'px');
    const splitter = panel.querySelector('.pfh-splitter');
    if (splitter) splitter.classList.toggle('is-dragging', Boolean(state.splitDragging));
  }

  function makeSplitterDraggable(panel, splitter) {
    state.splitDragging = false;
    splitter.addEventListener('mousedown', (event) => {
      state.splitDragging = true;
      state.ignoreOutsideClickUntil = Date.now() + 500;
      event.preventDefault();
      event.stopPropagation();
    });
    document.addEventListener('mousemove', (event) => {
      if (!state.splitDragging) return;
      const main = panel.querySelector('.pfh-main');
      if (!main) return;
      const rect = main.getBoundingClientRect();
      const width = clamp(event.clientX - rect.left, 110, Math.min(260, rect.width - 220));
      state.splitWidth = width;
      applySplitWidth(panel);
    });
    document.addEventListener('mouseup', () => {
      if (!state.splitDragging) return;
      state.splitDragging = false;
      saveSplitWidth(state.splitWidth);
      state.ignoreOutsideClickUntil = Date.now() + 300;
      applySplitWidth(panel);
    });
  }

  function makePanelResizable(panel) {
    let dragging = false;
    let direction = '';
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    let startRight = 0;
    let startBottom = 0;
    panel.querySelectorAll('.pfh-resize-handle').forEach((resizer) => resizer.addEventListener('mousedown', (event) => {
      dragging = true;
      direction = resizer.dataset.resizeDir || 'se';
      state.ignoreOutsideClickUntil = Date.now() + 500;
      startX = event.clientX;
      startY = event.clientY;
      const rect = panel.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;
      startRight = Number.parseFloat(getComputedStyle(panel).right) || 0;
      startBottom = Number.parseFloat(getComputedStyle(panel).bottom) || 0;
      event.preventDefault();
      event.stopPropagation();
    }));
    document.addEventListener('mousemove', (event) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      let width = startWidth;
      let height = startHeight;
      let right = startRight;
      let bottom = startBottom;
      const minWidth = 520;
      const maxWidth = Math.min(1180, window.innerWidth - 24);
      const maxHeight = getPanelMaxHeight();
      if (direction.includes('w')) width = startWidth - dx;
      if (direction.includes('e')) {
        width = startWidth + dx;
        right = startRight - dx;
      }
      if (direction.includes('n')) height = startHeight - dy;
      if (direction.includes('s')) {
        height = startHeight + dy;
        bottom = startBottom - dy;
      }
      width = clamp(width, minWidth, maxWidth);
      height = clamp(height, 520, maxHeight);
      right = Math.max(0, Math.min(window.innerWidth - width - 8, right));
      bottom = Math.max(0, Math.min(window.innerHeight - height - 8, bottom));
      state.panelSize = { width, height };
      panel.style.right = right + 'px';
      panel.style.bottom = bottom + 'px';
      applyPanelSize(panel);
      applySplitWidth(panel);
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      savePanelSize(state.panelSize);
      addLog('info', '窗口大小已保存', Math.round(state.panelSize.width) + ' x ' + Math.round(state.panelSize.height));
      savePosition({
        right: Number.parseFloat(getComputedStyle(panel).right) || 0,
        bottom: Number.parseFloat(getComputedStyle(panel).bottom) || 0,
      });
      state.ignoreOutsideClickUntil = Date.now() + 300;
    });
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function makeDraggable(panel, handle) {
    let startX = 0;
    let startY = 0;
    let startRight = 0;
    let startBottom = 0;
    let dragging = false;
    handle.addEventListener('mousedown', (event) => {
      if (event.target.tagName === 'BUTTON') return;
      if (event.target !== handle) return;
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      startRight = Number.parseFloat(getComputedStyle(panel).right) || 0;
      startBottom = Number.parseFloat(getComputedStyle(panel).bottom) || 0;
      event.preventDefault();
    });
    document.addEventListener('mousemove', (event) => {
      if (!dragging) return;
      panel.style.right = Math.max(0, startRight - (event.clientX - startX)) + 'px';
      panel.style.bottom = Math.max(0, startBottom - (event.clientY - startY)) + 'px';
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      savePosition({
        right: Number.parseFloat(getComputedStyle(panel).right) || 0,
        bottom: Number.parseFloat(getComputedStyle(panel).bottom) || 0,
      });
    });
  }

  function makeLauncherDraggable(launcher) {
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let dragging = false;
    let moved = false;
    launcher.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return;
      startX = event.clientX;
      startY = event.clientY;
      const rect = launcher.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      dragging = true;
      moved = false;
      event.preventDefault();
      event.stopPropagation();
    }, true);
    document.addEventListener('mousemove', (event) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      const left = clamp(startLeft + dx, 8, Math.max(8, window.innerWidth - launcher.offsetWidth - 8));
      const top = clamp(startTop + dy, 8, Math.max(8, window.innerHeight - launcher.offsetHeight - 8));
      launcher.style.left = left + 'px';
      launcher.style.top = top + 'px';
      event.preventDefault();
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      if (moved) {
        state.launcherSuppressClickUntil = Date.now() + 250;
        const rect = launcher.getBoundingClientRect();
        saveLauncherPosition({ left: rect.left, top: rect.top });
      }
    });
  }

  function getVisibleText(root) {
    return normalizeText((root && (root.innerText || root.textContent)) || '');
  }

  function getNodeText(root) {
    if (!root) return '';
    return normalizeText([root.innerText, root.textContent, root.getAttribute && root.getAttribute('title'), root.getAttribute && root.getAttribute('aria-label')]
      .filter(Boolean)
      .join('\n'));
  }

  function normalizeText(text) {
    return String(text || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n[ \t]+/g, '\n').trim();
  }

  function compactText(text) {
    return normalizeText(text).replace(/\s+/g, ' ');
  }

  function compactLabel(text) {
    return compactText(text).replace(/\*+$/g, '').trim();
  }

  function trimNumber(num) {
    return Number(num).toFixed(2).replace(/\.?0+$/, '');
  }

  function isVisibleElement(el) {
    if (!el || !el.isConnected) return false;
    let node = el;
    while (node && node.nodeType === 1) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      node = node.parentElement;
    }
    return el.getClientRects().length > 0;
  }

  function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(value));
    return String(value).replace(/["\\]/g, '\\$&');
  }

  function escapeHtml(text) {
    return String(text || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
  }

  function injectStyle() {
    const style = document.createElement('style');
    style.textContent = `
      #${PANEL_ID} {
        position: fixed;
        right: 18px;
        bottom: 78px;
        z-index: 2147483647;
        width: 560px;
        max-height: 78vh;
        color: #172033;
        background: rgba(255,255,255,0.98);
        border: 1px solid #d8dee9;
        border-radius: 8px;
        box-shadow: 0 12px 34px rgba(20,32,54,0.18);
        font: 13px/1.45 "MiSans", "Noto Sans SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        overflow: visible;
        display: block;
      }
      #${PANEL_ID}.is-collapsed {
        display: none !important;
      }
      #${LAUNCHER_ID} {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        min-width: 40px;
        max-width: 40px;
        height: 32px;
        margin: 0 0 0 8px;
        padding: 0 8px;
        color: rgba(0, 0, 0, 0.88);
        background: #fff;
        border: 1px solid #d9d9d9;
        border-radius: 6px;
        box-shadow: none;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        line-height: 1;
        vertical-align: middle;
        flex: 0 0 auto;
      }
      #${LAUNCHER_ID}:hover {
        border-color: #1677ff;
        color: #1677ff;
        background: #fff;
      }
      #${LAUNCHER_ID}.is-floating {
        position: fixed;
        z-index: 2147483647;
        width: 86px;
        min-width: 86px;
        max-width: 86px;
        height: 34px;
        margin: 0;
        border-radius: 8px;
        box-shadow: 0 8px 22px rgba(20,32,54,0.18);
        font-size: 13px;
        color: #1f3b67;
        border-color: #cad3df;
      }
      #${PANEL_ID} .pfh-header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 7px 10px;
        padding: 9px 10px;
        background: #f5f7fb;
        border-bottom: 1px solid #e5e9f0;
        cursor: move;
        user-select: none;
      }
      #${PANEL_ID} .pfh-toolrow {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 0 0 100%;
        min-height: 28px;
        cursor: default;
      }
      #${PANEL_ID} .pfh-toolrow button {
        width: 30px;
        height: 26px;
        padding: 0;
        color: #1f3b67;
        background: #fff;
        border: 1px solid #cad3df;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
      }
      #${PANEL_ID} .pfh-toolrow button:hover {
        border-color: #9db7f5;
        background: #f5f8ff;
      }
      #${PANEL_ID} .pfh-heading {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        flex: 1 1 auto;
      }
      #${PANEL_ID} .pfh-heading strong {
        flex: 0 0 auto;
      }
      #${PANEL_ID} .pfh-search {
        display: flex;
        align-items: center;
        gap: 5px;
        min-width: 150px;
        max-width: 260px;
        flex: 1 1 190px;
        cursor: default;
        user-select: text;
      }
      #${PANEL_ID} .pfh-search-box {
        position: relative;
        display: block;
        min-width: 0;
        width: 100%;
      }
      #${PANEL_ID} .pfh-search-input {
        min-width: 0;
        width: 100%;
        height: 24px;
        padding: 2px 24px 2px 7px;
        color: #1f2937;
        background: #fff;
        border: 1px solid #cad3df;
        border-radius: 5px;
        font-size: 12px;
        line-height: 18px;
        outline: none;
        overflow: visible;
      }
      #${PANEL_ID} .pfh-search-input:focus {
        border-color: #7c9cff;
        box-shadow: 0 0 0 2px rgba(124, 156, 255, 0.18);
      }
      #${PANEL_ID} .pfh-search-clear {
        position: absolute;
        top: 50%;
        right: 5px;
        display: none;
        width: 16px;
        height: 16px;
        padding: 0;
        transform: translateY(-50%);
        color: #64748b;
        background: transparent;
        border: 0;
        border-radius: 50%;
        font-size: 15px;
        line-height: 15px;
      }
      #${PANEL_ID} .pfh-search-clear.is-visible {
        display: block;
      }
      #${PANEL_ID} .pfh-search-clear:hover {
        color: #1f3b67;
        background: #edf2ff;
      }
      #${PANEL_ID} .pfh-actions {
        display: flex;
        gap: 6px;
        align-items: center;
        flex: 0 0 auto;
      }
      #${PANEL_ID} button {
        padding: 2px 7px;
        color: #1f3b67;
        background: #fff;
        border: 1px solid #cad3df;
        border-radius: 5px;
        font-size: 12px;
        cursor: pointer;
        white-space: nowrap;
      }
      #${PANEL_ID} button:hover {
        background: #eef4ff;
      }
      #${PANEL_ID} .pfh-main {
        display: grid;
        grid-template-columns: 150px 8px minmax(0, 1fr);
        height: 520px;
        min-height: 280px;
      }
      #${PANEL_ID} .pfh-main.is-home,
      #${PANEL_ID} .pfh-main.is-full {
        grid-template-columns: 0 0 minmax(0, 1fr);
      }
      #${PANEL_ID} .pfh-main.is-home .pfh-list,
      #${PANEL_ID} .pfh-main.is-home .pfh-splitter,
      #${PANEL_ID} .pfh-main.is-full .pfh-list,
      #${PANEL_ID} .pfh-main.is-full .pfh-splitter {
        display: none;
      }
      #${PANEL_ID} .pfh-main.is-home .pfh-detail,
      #${PANEL_ID} .pfh-main.is-full .pfh-detail {
        grid-column: 1 / -1;
      }
      #${PANEL_ID} .pfh-list {
        border-right: 1px solid #e5e9f0;
        background: #f8fafc;
        overflow-y: auto;
        height: 100%;
        padding: 8px;
      }
      #${PANEL_ID} .pfh-splitter {
        width: 6px;
        height: 100%;
        cursor: col-resize;
        opacity: 0;
        transition: opacity 160ms ease, background 160ms ease;
        background: linear-gradient(to right, transparent 0, transparent 3px, rgba(124, 58, 237, 0.16) 3px, rgba(124, 58, 237, 0.16) 5px, transparent 5px);
      }
      #${PANEL_ID} .pfh-splitter:hover,
      #${PANEL_ID} .pfh-splitter.is-dragging {
        opacity: 1;
      }
      #${PANEL_ID} .pfh-list,
      #${PANEL_ID} .pfh-sku-scroll,
      #${PANEL_ID} .pfh-detail {
        scrollbar-width: thin;
        scrollbar-color: rgba(148, 163, 184, 0.18) transparent;
      }
      #${PANEL_ID} .pfh-list:hover,
      #${PANEL_ID} .pfh-sku-scroll:hover,
      #${PANEL_ID} .pfh-detail:hover {
        scrollbar-color: rgba(148, 163, 184, 0.34) transparent;
      }
      #${PANEL_ID} .pfh-list::-webkit-scrollbar,
      #${PANEL_ID} .pfh-sku-scroll::-webkit-scrollbar,
      #${PANEL_ID} .pfh-detail::-webkit-scrollbar {
        width: 5px;
        height: 5px;
      }
      #${PANEL_ID} .pfh-list::-webkit-scrollbar-thumb,
      #${PANEL_ID} .pfh-sku-scroll::-webkit-scrollbar-thumb,
      #${PANEL_ID} .pfh-detail::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.18);
        border-radius: 999px;
      }
      #${PANEL_ID} .pfh-list:hover::-webkit-scrollbar-thumb,
      #${PANEL_ID} .pfh-sku-scroll:hover::-webkit-scrollbar-thumb,
      #${PANEL_ID} .pfh-detail:hover::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.42);
      }
      #${PANEL_ID} .pfh-empty {
        color: #8a94a6;
        font-size: 12px;
        padding: 8px 4px;
      }
      #${PANEL_ID} .pfh-list-note {
        margin: 0 0 7px;
        padding: 3px 4px;
        color: #64748b;
        font-size: 12px;
        border-bottom: 1px solid #e5e9f0;
      }
      #${PANEL_ID} .pfh-sku {
        display: block;
        width: 100%;
        margin: 0 0 6px;
        padding: 5px 6px;
        text-align: left;
        border-radius: 6px;
      }
      #${PANEL_ID} .pfh-sku.is-active {
        border-color: #7c3aed;
        background: #f3e8ff;
      }
      #${PANEL_ID} .pfh-sku.is-pinned {
        border-color: #d6dfeb;
        background: #fff;
      }
      #${PANEL_ID} .pfh-sku.is-pinned.is-active {
        border-color: #f59e0b;
        background: #fffbeb;
      }
      #${PANEL_ID} .pfh-sku span {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 5px;
      }
      #${PANEL_ID} .pfh-sku b {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 650;
      }
      #${PANEL_ID} .pfh-sku em {
        flex: 0 0 auto;
        color: #7c3aed;
        font-style: normal;
        font-size: 11px;
      }
      #${PANEL_ID} .pfh-sku small {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #${PANEL_ID} .pfh-sku small {
        margin-top: 2px;
        color: #667085;
        font-size: 11px;
      }
      #${PANEL_ID} .pfh-detail {
        position: relative;
        overflow: auto;
        height: 100%;
        padding: 10px;
      }
      #${PANEL_ID} .pfh-detail.is-loading {
        background: rgba(248, 250, 252, 0.92);
      }
      #${PANEL_ID} .pfh-detail.is-loading .pfh-section,
      #${PANEL_ID} .pfh-detail.is-loading .pfh-note {
        opacity: 0.45;
      }
      #${PANEL_ID} .pfh-detail.is-loading .pfh-status {
        position: absolute;
        top: 44%;
        left: 50%;
        z-index: 30;
        width: min(390px, calc(100% - 34px));
        margin: 0;
        transform: translate(-50%, -50%);
        text-align: center;
        color: #475569;
        font-weight: 700;
        pointer-events: none;
      }
      #${PANEL_ID} .pfh-loading-tip {
        display: grid;
        gap: 9px;
        padding: 15px 18px 16px;
        color: #5b4a77;
        background: linear-gradient(145deg, rgba(255,255,255,.88), rgba(247,243,255,.72));
        border: 1px solid rgba(137, 94, 255, 0.18);
        border-radius: 14px;
        box-shadow: 0 14px 40px rgba(88, 72, 145, 0.12), inset 0 1px 0 rgba(255,255,255,.86);
        text-align: left;
      }
      #${PANEL_ID} .pfh-loading-tip span {
        color: #8b5cf6;
        font-size: 13px;
        font-weight: 650;
        letter-spacing: 0;
      }
      #${PANEL_ID} .pfh-loading-tip strong {
        color: #42315f;
        font-size: 16px;
        line-height: 1.55;
        font-weight: 600;
      }
      #${PANEL_ID} .pfh-section {
        padding: 6px 0 8px;
        border-bottom: 1px solid #e6ebf2;
      }
      #${PANEL_ID} .pfh-section-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0 0 6px;
      }
      #${PANEL_ID} .pfh-title-meta {
        min-width: 0;
        color: #1e3a8a;
        background: #eef4ff;
        border: 1px solid #bdd0ff;
        border-radius: 6px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.65);
        font-size: 13px;
        font-weight: 800;
        line-height: 1.35;
        padding: 3px 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: pointer;
      }
      #${PANEL_ID} .pfh-title-meta:hover {
        background: #dfeaff;
        border-color: #9bb8ff;
      }
      #${PANEL_ID} .pfh-section:last-of-type {
        border-bottom: 0;
      }
      #${PANEL_ID} h3 {
        margin: 0 0 6px;
        font-size: 14px;
        line-height: 1.4;
        color: #243b5a;
      }
      #${PANEL_ID} .pfh-section-title h3 {
        margin: 0;
        flex: 0 0 auto;
      }
      #${PANEL_ID} .pfh-graphic-title {
        gap: 8px;
      }
      #${PANEL_ID} .pfh-excel-controls {
        display: flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
        margin-left: auto;
      }
      #${PANEL_ID} .pfh-excel-form.is-open {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        flex: 0 0 auto;
        flex-wrap: wrap;
        justify-content: flex-start;
        width: 100%;
        margin: 8px 0 12px;
        padding: 8px;
        border: 1px solid rgba(211,204,255,.42);
        border-radius: 12px;
        background: rgba(255,255,255,.58);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.86);
      }
      #${PANEL_ID} .pfh-excel-form input,
      #${PANEL_ID} .pfh-excel-form select {
        width: 62px;
        height: 28px;
        min-width: 0;
        padding: 0 7px;
        color: #1f2937;
        background: #fff;
        border: 1px solid #cad3df;
        border-radius: 5px;
        font-size: 12px;
        outline: none;
      }
      #${PANEL_ID} .pfh-excel-form select {
        width: 96px;
        flex: 0 0 96px;
      }
      #${PANEL_ID} .pfh-excel-form button {
        min-height: 28px;
        height: 28px;
        border-radius: 10px;
      }
      #${PANEL_ID} .pfh-excel-form > button[data-action="excel-generate"] {
        padding: 0 12px;
        white-space: nowrap;
      }
      #${PANEL_ID} .pfh-excel-form input:focus,
      #${PANEL_ID} .pfh-excel-form select:focus {
        border-color: #7c9cff;
        box-shadow: 0 0 0 2px rgba(124, 156, 255, 0.16);
      }
      #${PANEL_ID} .pfh-excel-status {
        min-width: 0;
        max-width: 160px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
        font-weight: 650;
      }
      #${PANEL_ID} .pfh-excel-status.is-good {
        color: #15803d;
      }
      #${PANEL_ID} .pfh-excel-status.is-bad {
        color: #b91c1c;
      }
      #${PANEL_ID} .pfh-upload-title {
        gap: 6px;
      }
      #${PANEL_ID} .pfh-upload-status {
        margin-left: auto;
        color: #64748b;
        font-size: 12px;
        font-weight: 650;
      }
      #${PANEL_ID}-upload-progress {
        position: fixed;
        z-index: 2147483647;
        display: grid;
        grid-template-columns: 26px minmax(0, 1fr) auto;
        gap: 7px;
        align-items: center;
        min-height: 40px;
        padding: 7px 9px;
        color: #172033;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid rgba(174, 194, 224, 0.82);
        border-radius: 6px;
        box-shadow: 0 10px 20px rgba(30, 64, 112, 0.16), 0 1px 5px rgba(30, 64, 112, 0.08);
        pointer-events: none;
      }
      #${PANEL_ID}-upload-progress::after {
        content: "";
        position: absolute;
        left: 46px;
        bottom: -7px;
        width: 13px;
        height: 13px;
        background: rgba(255, 255, 255, 0.96);
        border-right: 1px solid rgba(174, 194, 224, 0.82);
        border-bottom: 1px solid rgba(174, 194, 224, 0.82);
        transform: rotate(45deg);
      }
      #${PANEL_ID}-upload-progress.is-below::after {
        top: -7px;
        bottom: auto;
        transform: rotate(225deg);
      }
      #${PANEL_ID}-upload-progress .pfh-upload-progress-icon {
        display: grid;
        place-items: center;
        width: 26px;
        height: 26px;
        color: #fff;
        background: linear-gradient(135deg, #4f7cff, #14c8dc);
        border-radius: 50%;
        box-shadow: 0 0 0 5px rgba(79, 124, 255, 0.12);
      }
      #${PANEL_ID}-upload-progress .pfh-upload-progress-icon svg {
        width: 15px;
        height: 15px;
      }
      #${PANEL_ID}-upload-progress .pfh-upload-progress-main {
        display: grid;
        gap: 5px;
        min-width: 0;
      }
      #${PANEL_ID}-upload-progress .pfh-upload-progress-main strong {
        overflow: hidden;
        color: #111827;
        font-size: 11px;
        line-height: 1.2;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #${PANEL_ID}-upload-progress .pfh-upload-progress-main div {
        height: 4px;
        overflow: hidden;
        background: #e7edf5;
        border-radius: 999px;
      }
      #${PANEL_ID}-upload-progress .pfh-upload-progress-main span {
        display: block;
        height: 100%;
        background: linear-gradient(90deg, #4f7cff, #16c8dc);
        border-radius: inherit;
        transition: width 0.2s ease;
      }
      #${PANEL_ID}-upload-progress b {
        color: #4f7cff;
        font-size: 12px;
        font-weight: 800;
      }
      #${PANEL_ID} .pfh-upload-body {
        display: grid;
        gap: 6px;
        padding-top: 6px;
      }
      #${PANEL_ID} .pfh-upload-drop {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 46px;
        padding: 8px;
        color: #365e9d;
        background: #f5f8ff;
        border: 1px dashed #9db7f5;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 650;
      }
      #${PANEL_ID} .pfh-upload-line {
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr) auto;
        gap: 6px;
        align-items: center;
      }
      #${PANEL_ID} .pfh-upload-line span {
        color: #475467;
        font-size: 12px;
        font-weight: 700;
      }
      #${PANEL_ID} .pfh-upload-line input[type="text"] {
        width: 100%;
        min-width: 0;
        height: 26px;
        padding: 3px 7px;
        color: #101828;
        background: #fff;
        border: 1px solid #cad3df;
        border-radius: 5px;
        font-size: 12px;
        outline: none;
      }
      #${PANEL_ID} .pfh-upload-line input[type="text"]:focus {
        border-color: #7c9cff;
        box-shadow: 0 0 0 2px rgba(124, 156, 255, 0.16);
      }
      #${PANEL_ID} .pfh-upload-file {
        display: none;
      }
      #${PANEL_ID} .pfh-upload-file-name {
        margin-left: 48px;
        color: #64748b;
        font-size: 12px;
        word-break: break-all;
      }
      #${PANEL_ID} .pfh-upload-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
      }
      #${PANEL_ID} .pfh-upload-list {
        display: grid;
        gap: 5px;
        max-height: none;
        overflow: auto;
        padding-right: 2px;
      }
      #${PANEL_ID} .pfh-upload-table-head {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) 66px minmax(0, 1fr) auto;
        gap: 6px;
        align-items: center;
        min-height: 34px;
        padding: 0 6px;
        color: #647491;
        background: #f5f9fe;
        border-radius: 6px;
        font-size: 12px;
      }
      #${PANEL_ID} .pfh-upload-table-head.is-history {
        grid-template-columns: minmax(0, 1.15fr) 72px minmax(0, 1.25fr) 34px;
        min-height: 54px;
      }
      #${PANEL_ID} .pfh-upload-head-project {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
      #${PANEL_ID} .pfh-upload-head-project b {
        font-weight: 700;
      }
      #${PANEL_ID} .pfh-upload-head-project em {
        display: flex;
        gap: 6px;
        font-style: normal;
      }
      #${PANEL_ID} .pfh-upload-head-project button {
        height: 22px;
        padding: 0 8px;
        border: 1px solid #d6dfeb;
        border-radius: 5px;
        background: #fff;
        color: #17406f;
        font-size: 12px;
      }
      #${PANEL_ID} .pfh-upload-head-project button:disabled {
        opacity: .45;
        cursor: default;
      }
      #${PANEL_ID} .pfh-upload-item {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) 66px minmax(0, 1fr) auto;
        gap: 6px;
        align-items: center;
        padding: 6px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 12px;
      }
      #${PANEL_ID} .pfh-upload-item.is-current {
        border-color: #a78bfa;
        background: #faf5ff;
      }
      #${PANEL_ID} .pfh-upload-item b,
      #${PANEL_ID} .pfh-upload-item small,
      #${PANEL_ID} .pfh-upload-item em {
        display: block;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #${PANEL_ID} .pfh-upload-item small {
        color: #64748b;
        font-style: normal;
      }
      #${PANEL_ID} .pfh-upload-item span {
        color: #155eef;
        font-weight: 700;
      }
      #${PANEL_ID} .pfh-upload-item span.is-ready {
        color: #15803d;
      }
      #${PANEL_ID} .pfh-upload-item span.is-success {
        color: #15803d !important;
      }
      #${PANEL_ID} .pfh-upload-item span.is-missing {
        color: #b91c1c;
      }
      #${PANEL_ID} .pfh-upload-item em {
        color: #475467;
        font-style: normal;
      }
      #${PANEL_ID} .pfh-setting-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
        border-bottom: 1px dashed #e2e8f0;
        color: #334155;
        font-size: 13px;
      }
      #${PANEL_ID} .pfh-setting-row > span {
        min-width: 84px;
        color: #64748b;
      }
      #${PANEL_ID} .pfh-setting-row label {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        position: relative;
        min-height: 28px;
        padding: 0 12px;
        color: #c9d0db;
        border: 1px solid #cfd5df;
        border-radius: 999px;
        cursor: pointer;
        white-space: nowrap;
      }
      #${PANEL_ID} .pfh-setting-row label:has(input:checked) {
        color: #334155;
        background: #e9fced;
        border-color: #e9fced;
      }
      #${PANEL_ID} .pfh-setting-row input[type="radio"] {
        position: absolute;
        width: 0;
        height: 0;
        margin: 0;
        padding: 0;
        opacity: 0;
        appearance: none;
        pointer-events: none;
      }
      #${PANEL_ID} .pfh-setting-row label::before {
        content: '';
        width: 6px;
        height: 6px;
        flex: 0 0 6px;
        display: block;
        background: center / contain no-repeat url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z' fill='%23e6e6e6'/%3E%3C/svg%3E");
      }
      #${PANEL_ID} .pfh-setting-row label:has(input:checked)::before {
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z' fill='%231afa29'/%3E%3C/svg%3E");
      }
      #${PANEL_ID} .pfh-cloud-backup {
        margin: 10px 0;
        padding: 10px;
        border: 1px solid #dbe3ef;
        border-radius: 6px;
        background: #f8fafc;
      }
      #${PANEL_ID} .pfh-cloud-backup h4 {
        margin: 0 0 8px;
        font-size: 13px;
        color: #243b5a;
      }
      #${PANEL_ID} .pfh-cloud-backup p {
        margin: 7px 0 0;
        color: #64748b;
        font-size: 12px;
        line-height: 1.45;
      }
      #${PANEL_ID} .pfh-cloud-key {
        display: grid;
        grid-template-columns: 84px minmax(0, 1fr);
        gap: 8px;
        align-items: center;
        font-size: 13px;
        color: #64748b;
      }
      #${PANEL_ID} .pfh-cloud-key input {
        height: 28px;
        min-width: 0;
        padding: 0 8px;
        border: 1px solid #cfd8e3;
        border-radius: 5px;
        background: #fff;
        color: #1f2937;
        outline: none;
      }
      #${PANEL_ID} .pfh-cloud-key input:focus {
        border-color: #7c9cff;
        box-shadow: 0 0 0 2px rgba(124, 156, 255, 0.18);
      }
      #${PANEL_ID} .pfh-cloud-status {
        min-width: 0;
        color: #2563eb;
        font-size: 12px;
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #${PANEL_ID} .pfh-easter-egg {
        padding: 8px 0;
        letter-spacing: 1px;
        user-select: text;
      }
      #${PANEL_ID} .pfh-row {
        display: grid;
        grid-template-columns: 118px minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
        padding: 5px 0;
        border-bottom: 1px dashed #eef2f7;
      }
      #${PANEL_ID} .pfh-row:last-child {
        border-bottom: 0;
      }
      #${PANEL_ID} .pfh-label {
        color: #667085;
      }
      #${PANEL_ID} .pfh-value {
        color: #101828;
        font-weight: 650;
        word-break: break-word;
      }
      #${PANEL_ID} .pfh-row-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 5px;
      }
      #${PANEL_ID} .pfh-import-file {
        display: none;
      }
      #${PANEL_ID} .pfh-about-note {
        margin: 8px 0 10px;
        padding: 8px 10px;
        color: #475467;
        background: #f8fafc;
        border: 1px solid #e5e9f0;
        border-radius: 6px;
        font-size: 12px;
        line-height: 1.5;
      }
      #${PANEL_ID} .pfh-about-note strong {
        display: block;
        margin-bottom: 4px;
        color: #243b5a;
      }
      #${PANEL_ID} .pfh-about-note p {
        margin: 0;
      }
      #${PANEL_ID} .pfh-warning-note {
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr);
        gap: 10px;
        align-items: flex-start;
        border-color: #fecaca;
        background: #fff7f7;
        color: #7f1d1d;
      }
      #${PANEL_ID} .pfh-warning-note .pfh-icon {
        width: 26px;
        height: 26px;
        border: 0;
        background: transparent;
        color: #d81e06;
      }
      #${PANEL_ID} .pfh-warning-note .pfh-icon svg {
        width: 22px;
        height: 22px;
        fill: currentColor;
        stroke: none;
      }
      #${PANEL_ID} .pfh-manual-note p {
        white-space: pre-line;
      }
      #${PANEL_ID} .pfh-about-actions {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-top: 8px;
      }
      #${PANEL_ID} .pfh-tutorial-hero {
        margin-bottom: 10px;
        padding: 12px 14px;
        color: #365e9d;
        background: #f5f8ff;
        border: 1px solid #dfe8ff;
        border-radius: 8px;
      }
      #${PANEL_ID} .pfh-tutorial-hero h3 {
        margin: 0 0 6px;
        color: #0b1120;
        font-size: 18px;
      }
      #${PANEL_ID} .pfh-tutorial-hero p {
        margin: 0;
        line-height: 1.55;
      }
      #${PANEL_ID} .pfh-tutorial-steps {
        display: grid;
        gap: 8px;
      }
      #${PANEL_ID} .pfh-tutorial-steps article {
        display: grid;
        grid-template-columns: 32px minmax(0, 1fr);
        gap: 10px;
        align-items: start;
        padding: 10px;
        border: 1px solid #e1e9f4;
        border-radius: 8px;
        background: #fff;
      }
      #${PANEL_ID} .pfh-tutorial-steps article > b {
        display: grid;
        place-items: center;
        width: 26px;
        height: 26px;
        color: #fff;
        background: #613df4;
        border-radius: 50%;
      }
      #${PANEL_ID} .pfh-tutorial-steps strong {
        display: block;
        margin-bottom: 4px;
        color: #0b1120;
      }
      #${PANEL_ID} .pfh-tutorial-steps p {
        margin: 0;
        color: #566381;
        line-height: 1.55;
      }
      #${PANEL_ID} .pfh-tutorial-actions {
        position: sticky;
        bottom: 0;
        padding-top: 8px;
        background: linear-gradient(to bottom, rgba(255,255,255,0), #fff 18%);
      }
      #${PANEL_ID} .pfh-tutorial-actions button:first-child {
        color: #fff;
        background: #613df4;
        border-color: #613df4;
      }
      #${PANEL_ID} .pfh-inline-edit {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      #${PANEL_ID} .pfh-tail-input {
        width: 76px;
        height: 24px;
        padding: 2px 6px;
        color: #101828;
        border: 1px solid #cad3df;
        border-radius: 5px;
        font-size: 12px;
        outline: none;
      }
      #${PANEL_ID} .pfh-tail-input:focus {
        border-color: #7c9cff;
        box-shadow: 0 0 0 2px rgba(124, 156, 255, 0.18);
      }
      #${PANEL_ID} .pfh-row.is-carton-dim .pfh-label,
      #${PANEL_ID} .pfh-row.is-carton-dim .pfh-value {
        color: #7c3aed;
      }
      #${PANEL_ID} .pfh-row.is-product-dim .pfh-label,
      #${PANEL_ID} .pfh-row.is-product-dim .pfh-value {
        color: #15803d;
      }
      #${PANEL_ID} .pfh-note,
      #${PANEL_ID} .pfh-status {
        margin: 8px 0 0;
        color: #8a94a6;
        font-size: 12px;
      }
      #${PANEL_ID} .pfh-status {
        color: #137333;
      }
      #${PANEL_ID} .pfh-toast {
        position: absolute;
        right: 10px;
        bottom: 10px;
        max-width: min(360px, calc(100% - 20px));
        padding: 4px 8px;
        color: #137333;
        background: rgba(236,253,245,0.96);
        border: 1px solid #bbf7d0;
        border-radius: 6px;
        box-shadow: 0 6px 16px rgba(20,32,54,0.12);
        font-size: 12px;
        line-height: 1.45;
        word-break: break-word;
        pointer-events: none;
      }
      #${PANEL_ID} .pfh-resizer {
        position: absolute;
        right: 2px;
        bottom: 2px;
        width: 14px;
        height: 14px;
        cursor: nwse-resize;
        opacity: 0.38;
        background: linear-gradient(135deg, transparent 0 45%, #64748b 45% 55%, transparent 55% 100%);
      }
      #${PANEL_ID} .pfh-resizer:hover {
        opacity: 0.75;
      }
      #${PANEL_ID} {
        width: 790px;
        max-height: 86vh;
        color: #0b1120;
        background: #fff;
        border-color: #d6dfeb;
        border-radius: 8px;
        box-shadow: 0 12px 36px rgba(16, 24, 40, 0.10);
      }
      #${PANEL_ID} .pfh-header {
        flex-wrap: nowrap;
        gap: 14px;
        min-height: 68px;
        padding: 14px 16px;
        background: #fff;
        border-bottom-color: #e0e7f0;
      }
      #${PANEL_ID} .pfh-heading {
        gap: 14px;
      }
      #${PANEL_ID} .pfh-heading strong {
        position: relative;
        min-width: 120px;
        padding-left: 34px;
        color: #0b1120;
        font-size: 16px;
        font-weight: 800;
      }
      #${PANEL_ID} .pfh-heading strong::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        width: 28px;
        height: 28px;
        transform: translateY(-50%);
        border-radius: 6px;
        background: #bdeefb;
      }
      #${PANEL_ID} .pfh-heading strong::after {
        content: '';
        position: absolute;
        left: 8px;
        top: 50%;
        width: 14px;
        height: 14px;
        transform: translateY(-50%) rotate(45deg);
        border-radius: 3px;
        background: linear-gradient(135deg, #5138d8, #8b7cff);
        box-shadow: inset -4px 4px 0 rgba(159, 243, 255, .45);
      }
      #${PANEL_ID} .pfh-search {
        max-width: 340px;
        min-width: 250px;
        flex: 1 1 330px;
        gap: 0;
      }
      #${PANEL_ID} .pfh-search-box {
        flex: 1 1 auto;
      }
      #${PANEL_ID} .pfh-search-box::before {
        content: '';
        position: absolute;
        left: 12px;
        top: 50%;
        width: 12px;
        height: 12px;
        transform: translateY(-50%);
        border: 2px solid #8f9bb4;
        border-radius: 50%;
        pointer-events: none;
      }
      #${PANEL_ID} .pfh-search-box::after {
        content: '';
        position: absolute;
        left: 25px;
        top: 58%;
        width: 7px;
        height: 2px;
        transform: rotate(45deg);
        background: #8f9bb4;
        border-radius: 2px;
        pointer-events: none;
      }
      #${PANEL_ID} .pfh-search-input {
        height: 32px;
        line-height: 30px;
        padding-left: 34px;
        border-color: #d6dfeb;
        border-radius: 5px 0 0 5px;
        color: #0b1120;
      }
      #${PANEL_ID} .pfh-search > button {
        height: 32px;
        min-width: 64px;
        margin-left: -1px;
        color: #fff;
        background: #613df4;
        border-color: #613df4;
        border-radius: 0 5px 5px 0;
        font-weight: 800;
      }
      #${PANEL_ID} .pfh-search > button:hover {
        color: #fff;
        background: #5138d8;
        border-color: #5138d8;
      }
      #${PANEL_ID} .pfh-actions,
      #${PANEL_ID} .pfh-toolrow {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        flex: 0 0 auto;
      }
      #${PANEL_ID} .pfh-toolrow {
        min-height: auto;
      }
      #${PANEL_ID} .pfh-actions button,
      #${PANEL_ID} .pfh-toolrow button {
        width: 54px;
        height: 50px;
        padding: 0;
        display: grid;
        grid-template-rows: 26px 18px;
        place-items: center;
        gap: 1px;
        color: #0b1120;
        background: transparent;
        border: 0;
        border-radius: 0;
        font-size: 11px;
        font-weight: 800;
      }
      #${PANEL_ID} .pfh-actions button:hover,
      #${PANEL_ID} .pfh-toolrow button:hover {
        background: transparent;
      }
      #${PANEL_ID} .pfh-actions button:hover .pfh-icon,
      #${PANEL_ID} .pfh-toolrow button:hover .pfh-icon,
      #${PANEL_ID} .pfh-note button:hover,
      #${PANEL_ID} [data-copy-key]:hover,
      #${PANEL_ID} .pfh-excel-controls > button[data-action="excel-prepare"]:hover {
        background: #f3f6fb;
        filter: brightness(.96);
      }
      #${PANEL_ID} .pfh-actions button::before,
      #${PANEL_ID} .pfh-toolrow button::before {
        content: '';
        position: absolute;
      }
      #${PANEL_ID} .pfh-icon {
        width: 26px;
        height: 26px;
        display: grid;
        place-items: center;
        border: 1px solid #d6dfeb;
        border-radius: 5px;
        background: #fff;
      }
      #${PANEL_ID} .pfh-icon svg {
        width: 15px;
        height: 15px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      #${PANEL_ID} .pfh-icon-settings { color: #566381; }
      #${PANEL_ID} .pfh-icon-folder { color: #ffb22c; }
      #${PANEL_ID} .pfh-icon-upload { color: #2882eb; }
      #${PANEL_ID} .pfh-icon-collapse { color: #7175b4; }
      #${PANEL_ID} .pfh-icon-refresh { color: #566381; }
      #${PANEL_ID} .pfh-main {
        grid-template-columns: 214px 14px minmax(0, 1fr);
        height: 690px;
        min-height: 420px;
        padding: 12px 16px 16px;
        background: #fff;
      }
      #${PANEL_ID} .pfh-list,
      #${PANEL_ID} .pfh-detail {
        border: 1px solid #d6dfeb;
        border-radius: 6px;
        background: #fff;
      }
      #${PANEL_ID} .pfh-list {
        display: flex;
        flex-direction: column;
        padding: 12px;
        border-right: 1px solid #d6dfeb;
        overflow: hidden;
      }
      #${PANEL_ID} .pfh-splitter {
        width: 14px;
        background: transparent;
      }
      #${PANEL_ID} .pfh-list-head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 14px;
      }
      #${PANEL_ID} .pfh-list-head strong {
        color: #0b1120;
        font-size: 16px;
        font-weight: 900;
      }
      #${PANEL_ID} .pfh-list-head span {
        margin-left: auto;
        color: #647491;
        font-size: 12px;
        font-weight: 800;
      }
      #${PANEL_ID} .pfh-list-head button {
        width: 24px;
        height: 24px;
        padding: 0;
        border: 0;
        color: #2e3f65;
        background: transparent;
      }
      #${PANEL_ID} .pfh-sku-scroll {
        min-height: 0;
        flex: 1 1 auto;
        overflow-y: auto;
        padding-right: 5px;
      }
      #${PANEL_ID} .pfh-list-pager {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
        margin-top: 10px;
        padding-top: 8px;
        color: #647491;
        font-size: 12px;
        font-weight: 600;
        background: #fff;
      }
      #${PANEL_ID} .pfh-list-pager > div {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      #${PANEL_ID} .pfh-list-pager button,
      #${PANEL_ID} .pfh-list-pager b {
        width: 24px;
        height: 24px;
        display: grid;
        place-items: center;
        padding: 0;
        border: 1px solid #d6dfeb;
        border-radius: 5px;
        background: #fff;
        color: #647491;
      }
      #${PANEL_ID} .pfh-list-pager button:disabled {
        opacity: .45;
        cursor: default;
      }
      #${PANEL_ID} .pfh-list-pager b {
        color: #613df4;
        border-color: #613df4;
        font-weight: 900;
      }
      #${PANEL_ID} .pfh-sku {
        min-height: 50px;
        margin-bottom: 10px;
        padding: 8px 10px;
        border-color: #d6dfeb;
        border-radius: 5px;
        background: #fff;
        position: relative;
        overflow: hidden;
      }
      #${PANEL_ID} .pfh-sku.is-pinned::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 5px;
        background: #ffb944;
      }
      #${PANEL_ID} .pfh-sku.is-active {
        border-color: #613df4;
        background: #f5f2ff;
      }
      #${PANEL_ID} .pfh-sku.is-pinned:not(.is-active) {
        border-color: #d6dfeb;
        background: #fff;
      }
      #${PANEL_ID} .pfh-sku.is-pinned.is-active {
        border-color: #f59e0b;
        background: #fffbeb;
      }
      #${PANEL_ID} .pfh-sku b {
        color: #0b1120;
        font-size: 13px;
        font-weight: 900;
      }
      #${PANEL_ID} .pfh-sku small {
        color: #647491;
        font-size: 11px;
        font-weight: 600;
      }
      #${PANEL_ID} .pfh-detail {
        padding: 12px;
      }
      #${PANEL_ID} .pfh-section {
        padding: 0;
        border-bottom: 0;
        margin-bottom: 14px;
      }
      #${PANEL_ID} .pfh-section-title {
        margin-bottom: 10px;
      }
      #${PANEL_ID} .pfh-section-title h3 {
        color: #0b1120;
        font-size: 15px;
        font-weight: 900;
      }
      #${PANEL_ID} .pfh-file-section .pfh-section-title {
        margin-bottom: 10px;
      }
      #${PANEL_ID} .pfh-title-meta {
        flex: 1 1 auto;
        padding: 8px 12px;
        color: #1b3d8d;
        background: #f3f0ff;
        border: 0;
        border-radius: 5px;
        font-size: 14px;
        font-weight: 900;
      }
      #${PANEL_ID} .pfh-row {
        min-height: 38px;
        grid-template-columns: 160px minmax(0, 1fr) 34px;
        padding: 7px 10px;
        border-bottom: 1px solid #e0e7f0;
      }
      #${PANEL_ID} .pfh-label {
        display: flex;
        align-items: center;
        gap: 9px;
        color: #566381;
        font-weight: 700;
      }
      #${PANEL_ID} .pfh-label .pfh-icon {
        width: 16px;
        height: 16px;
        border: 0;
        background: transparent;
        color: currentColor;
      }
      #${PANEL_ID} .pfh-label .pfh-icon svg {
        width: 14px;
        height: 14px;
      }
      #${PANEL_ID} .pfh-value {
        color: #0b1120;
        font-weight: 900;
      }
      #${PANEL_ID} [data-copy-key] {
        width: 26px;
        height: 26px;
        padding: 0;
        display: grid;
        place-items: center;
        border-color: #d6dfeb;
        border-radius: 5px;
        color: #613df4;
        background: #fff;
      }
      #${PANEL_ID} [data-copy-key] .pfh-icon {
        width: auto;
        height: auto;
        border: 0;
        background: transparent;
      }
      #${PANEL_ID} .pfh-row.is-carton-dim .pfh-label,
      #${PANEL_ID} .pfh-row.is-carton-dim .pfh-value {
        color: #613df4;
      }
      #${PANEL_ID} .pfh-row.is-product-dim .pfh-label,
      #${PANEL_ID} .pfh-row.is-product-dim .pfh-value {
        color: #109848;
      }
      #${PANEL_ID} .pfh-note {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 42px;
        margin-top: 10px;
        padding: 0 12px;
        border-radius: 5px;
        background: #f5f9fe;
        color: #647491;
      }
      #${PANEL_ID} .pfh-note span {
        min-width: 0;
        flex: 1 1 auto;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #${PANEL_ID} .pfh-note button {
        width: 28px;
        height: 28px;
        padding: 0;
        display: grid;
        place-items: center;
        border-color: #d6dfeb;
        border-radius: 5px;
        background: #fff;
      }
      #${PANEL_ID} .pfh-note button .pfh-icon {
        width: 18px;
        height: 18px;
        border: 0;
        color: #566381;
      }
      #${PANEL_ID} .pfh-excel-controls > button[data-action="excel-prepare"] {
        min-width: 86px;
        height: 28px;
        min-height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 0 10px;
        color: #0b1120;
        border-color: #d6dfeb;
        border-radius: 5px;
        background: #fff;
        font-weight: 800;
      }
      #${PANEL_ID} .pfh-excel-controls > button[data-action="excel-prepare"] .pfh-icon {
        width: 16px;
        height: 16px;
        border: 0;
        color: #566381;
      }
      #${PANEL_ID} .pfh-excel-controls > button[data-action="excel-prepare"] svg {
        width: 14px;
        height: 14px;
      }
      #${PANEL_ID} {
        width: 880px;
        color: #1f2937;
        border-color: #e4ebf5;
        box-shadow: 0 10px 28px rgba(15, 23, 42, 0.09);
        font-family: "MiSans", "Noto Sans SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      #${PANEL_ID} .pfh-header {
        min-height: 66px;
        border-bottom-color: #edf1f6;
      }
      #${PANEL_ID} .pfh-heading strong {
        min-width: 126px;
        font-size: 17px;
        font-weight: 700;
      }
      #${PANEL_ID} .pfh-search {
        min-width: 360px;
        max-width: 390px;
        flex-basis: 390px;
      }
      #${PANEL_ID} .pfh-search-input {
        height: 34px;
        padding-left: 36px;
        padding-right: 24px;
        border-color: #dbe4f0;
        color: #334155;
        font-size: 12px;
        font-weight: 500;
      }
      #${PANEL_ID} .pfh-search-input::placeholder {
        color: #7a89a5;
        opacity: 1;
      }
      #${PANEL_ID} .pfh-search-box::before {
        left: 14px;
        width: 12px;
        height: 12px;
        border: 2px solid #8f9bb4;
      }
      #${PANEL_ID} .pfh-search-box::after {
        left: 25px;
        top: 20px;
        width: 6px;
        height: 2px;
        background: #8f9bb4;
        transform: rotate(45deg);
      }
      #${PANEL_ID} .pfh-search > button {
        height: 34px;
        min-width: 76px;
        font-weight: 700;
      }
      #${PANEL_ID} .pfh-actions,
      #${PANEL_ID} .pfh-toolrow {
        gap: 14px;
      }
      #${PANEL_ID} .pfh-actions button,
      #${PANEL_ID} .pfh-toolrow button {
        width: 56px;
        color: #111827;
        font-weight: 600;
        position: relative;
      }
      #${PANEL_ID} .pfh-actions button.has-notice::after {
        content: '';
        position: absolute;
        right: 8px;
        top: 2px;
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #ff1d1d;
        box-shadow: 0 0 0 2px #fff;
      }
      #${PANEL_ID} .pfh-icon {
        border-color: #dfe7f2;
      }
      #${PANEL_ID} .pfh-icon svg {
        stroke-width: 1.75;
      }
      #${PANEL_ID} .pfh-list,
      #${PANEL_ID} .pfh-detail {
        border-color: #e1e9f4;
      }
      #${PANEL_ID} .pfh-list-head strong,
      #${PANEL_ID} .pfh-section-title h3 {
        font-weight: 700;
      }
      #${PANEL_ID} .pfh-sku {
        border-color: #dfe7f2;
        box-shadow: none;
      }
      #${PANEL_ID} .pfh-sku b {
        font-weight: 700;
      }
      #${PANEL_ID} .pfh-sku small {
        font-weight: 500;
      }
      #${PANEL_ID} .pfh-title-meta {
        color: #1e3a8a;
        background: #f4f1ff;
        font-weight: 700;
      }
      #${PANEL_ID} .pfh-row {
        border-bottom-color: #edf1f6;
      }
      #${PANEL_ID} .pfh-label {
        color: #647491;
        font-weight: 500;
      }
      #${PANEL_ID} .pfh-value,
      #${PANEL_ID} .pfh-row.is-carton-dim .pfh-value,
      #${PANEL_ID} .pfh-row.is-product-dim .pfh-value {
        font-weight: 700;
      }
      #${PANEL_ID} .pfh-row.is-carton-dim .pfh-label,
      #${PANEL_ID} .pfh-row.is-product-dim .pfh-label {
        font-weight: 600;
      }
      #${PANEL_ID} [data-copy-key],
      #${PANEL_ID} .pfh-note button,
      #${PANEL_ID} .pfh-excel-controls > button[data-action="excel-prepare"] {
        border-color: #dfe7f2;
      }
      #${PANEL_ID} .pfh-note {
        background: #f6f9fd;
        color: #647491;
        font-weight: 500;
      }
      #${PANEL_ID} {
        --pfh-item-col: minmax(145px, 0.95fr);
        --pfh-value-col: minmax(150px, 1.15fr);
        --pfh-action-col: 48px;
      }
      #${PANEL_ID} .pfh-header {
        display: grid !important;
        grid-template-columns: auto minmax(220px, 1fr) auto;
        align-items: center !important;
        flex-wrap: nowrap !important;
        gap: 10px !important;
      }
      #${PANEL_ID} .pfh-heading {
        min-width: 0;
        display: contents !important;
        flex: none !important;
        gap: 8px !important;
      }
      #${PANEL_ID} .pfh-heading strong {
        flex: 0 0 auto;
        min-width: 124px !important;
        align-self: center;
      }
      #${PANEL_ID} .pfh-search {
        min-width: 170px !important;
        max-width: none !important;
        width: 100% !important;
        flex: none !important;
      }
      #${PANEL_ID} .pfh-search > button {
        min-width: 58px !important;
      }
      #${PANEL_ID} .pfh-actions {
        flex: 0 1 auto !important;
        gap: 6px !important;
        margin-left: auto;
        align-items: center !important;
      }
      #${PANEL_ID} .pfh-actions button {
        width: 44px !important;
        font-size: 10px !important;
      }
      #${PANEL_ID} .pfh-actions .pfh-icon {
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 0;
      }
      #${PANEL_ID} .pfh-icon-settings svg,
      #${PANEL_ID} .pfh-icon-folder svg,
      #${PANEL_ID} .pfh-icon-upload svg,
      #${PANEL_ID} .pfh-icon-pin svg {
        fill: currentColor !important;
        stroke: none !important;
      }
      #${PANEL_ID} .pfh-actions .pfh-icon svg {
        display: block;
        transform-origin: 50% 50%;
      }
      #${PANEL_ID} .pfh-actions .pfh-icon-settings svg {
        width: 16px;
        height: 16px;
        transform: translateY(0.2px);
      }
      #${PANEL_ID} .pfh-actions .pfh-icon-folder svg {
        width: 16px;
        height: 16px;
        transform: translateY(0.2px);
      }
      #${PANEL_ID} .pfh-actions .pfh-icon-upload svg {
        width: 16px;
        height: 16px;
        transform: translateY(-0.4px);
      }
      #${PANEL_ID} .pfh-actions .pfh-icon-collapse svg {
        width: 15px;
        height: 15px;
        transform: translateY(0.2px);
      }
      #${PANEL_ID} .pfh-icon-settings { color: #566381; }
      #${PANEL_ID} .pfh-icon-folder { color: #ffb944; }
      #${PANEL_ID} .pfh-icon-upload { color: #80ed99; }
      #${PANEL_ID} .pfh-icon-pin { color: #1b4965; }
      #${PANEL_ID} .pfh-icon-close {
        color: #515151 !important;
        background: transparent !important;
        border-color: transparent !important;
      }
      #${PANEL_ID} .pfh-icon-close svg {
        fill: currentColor !important;
        stroke: none !important;
        opacity: 1 !important;
      }
      .pfh-force-upload-actions .ant-upload-list-item-actions,
      .pfh-force-upload-actions .ant-upload-list-item-card-actions,
      .pfh-force-upload-actions .delBtnIcon,
      .pfh-force-upload-actions .downloadBtn,
      .pfh-force-upload-actions .downloadBtnIcon,
      .pfh-force-upload-actions .anticon-vertical-align-bottom {
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
      }
      #${PANEL_ID} .pfh-row,
      #${PANEL_ID} .pfh-table-head,
      #${PANEL_ID} .pfh-graphic-table .pfh-row {
        grid-template-columns: var(--pfh-item-col) var(--pfh-value-col) var(--pfh-action-col) !important;
      }
      #${PANEL_ID} .pfh-value {
        justify-self: start;
        text-align: left;
      }
      #${PANEL_ID} .pfh-row-actions {
        justify-content: center;
      }
      #${PANEL_ID} .pfh-search-box::before {
        left: 14px !important;
        width: 18px !important;
        height: 18px !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: #8f9bb4 !important;
        -webkit-mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M446.112323 177.545051c137.567677 0.219798 252.612525 104.59798 266.162424 241.493333 13.562828 136.895354-78.778182 261.818182-213.617777 289.008485-134.852525 27.203232-268.386263-52.156768-308.945455-183.608889s25.018182-272.252121 151.738182-325.779394A267.235556 267.235556 0 0 1 446.112323 177.545051m0-62.060607c-182.794343 0-330.989899 148.195556-330.989899 330.989899s148.195556 330.989899 330.989899 330.989899 330.989899-148.195556 330.989899-330.989899-148.195556-330.989899-330.989899-330.989899z m431.321212 793.341415a30.849293 30.849293 0 0 1-21.94101-9.102223l-157.220202-157.220202c-11.752727-12.179394-11.584646-31.534545 0.37495-43.50707 11.972525-11.972525 31.327677-12.140606 43.494141-0.37495l157.220202 157.220202a31.036768 31.036768 0 0 1 6.723232 33.810101 31.004444 31.004444 0 0 1-28.651313 19.174142z'/%3E%3C/svg%3E") center / contain no-repeat;
        mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M446.112323 177.545051c137.567677 0.219798 252.612525 104.59798 266.162424 241.493333 13.562828 136.895354-78.778182 261.818182-213.617777 289.008485-134.852525 27.203232-268.386263-52.156768-308.945455-183.608889s25.018182-272.252121 151.738182-325.779394A267.235556 267.235556 0 0 1 446.112323 177.545051m0-62.060607c-182.794343 0-330.989899 148.195556-330.989899 330.989899s148.195556 330.989899 330.989899 330.989899 330.989899-148.195556 330.989899-330.989899-148.195556-330.989899-330.989899-330.989899z m431.321212 793.341415a30.849293 30.849293 0 0 1-21.94101-9.102223l-157.220202-157.220202c-11.752727-12.179394-11.584646-31.534545 0.37495-43.50707 11.972525-11.972525 31.327677-12.140606 43.494141-0.37495l157.220202 157.220202a31.036768 31.036768 0 0 1 6.723232 33.810101 31.004444 31.004444 0 0 1-28.651313 19.174142z'/%3E%3C/svg%3E") center / contain no-repeat;
      }
      #${PANEL_ID} .pfh-search-box::after {
        display: none !important;
      }
      #${PANEL_ID} .pfh-search-input {
        padding-left: 44px !important;
      }
      #${PANEL_ID} .pfh-list::-webkit-scrollbar,
      #${PANEL_ID} .pfh-sku-scroll::-webkit-scrollbar,
      #${PANEL_ID} .pfh-detail::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }
      #${PANEL_ID} .pfh-list::-webkit-scrollbar-thumb,
      #${PANEL_ID} .pfh-sku-scroll::-webkit-scrollbar-thumb,
      #${PANEL_ID} .pfh-detail::-webkit-scrollbar-thumb {
        background: rgba(124, 140, 190, .16);
        border-radius: 999px;
      }
      #${PANEL_ID} .pfh-list:hover::-webkit-scrollbar-thumb,
      #${PANEL_ID} .pfh-sku-scroll:hover::-webkit-scrollbar-thumb,
      #${PANEL_ID} .pfh-detail:hover::-webkit-scrollbar-thumb {
        background: rgba(124, 140, 190, .30);
      }
      #${PANEL_ID} .pfh-splitter {
        width: 8px;
        background: transparent;
        opacity: 0;
        transition: opacity 140ms ease;
      }
      #${PANEL_ID} .pfh-splitter.is-dragging,
      #${PANEL_ID} .pfh-splitter:hover {
        opacity: 1;
        background: linear-gradient(to right, transparent 0 2px, rgba(124,58,237,.18) 2px 6px, transparent 6px);
      }
      #${PANEL_ID} .pfh-excel-controls {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      #${PANEL_ID} .pfh-excel-controls > button[data-action="excel-prepare"],
      #${PANEL_ID} .pfh-excel-controls > button[data-action="excel-generate"],
      #${PANEL_ID} .pfh-tutorial-actions button,
      #${PANEL_ID} .pfh-home-card {
        border-radius: 12px;
      }
      #${PANEL_ID} .pfh-title-meta {
        cursor: pointer;
      }
      #${PANEL_ID} .pfh-detail {
        display: flex;
        flex-direction: column;
        overflow: hidden !important;
      }
      #${PANEL_ID} .pfh-detail-scroll {
        min-height: 0;
        flex: 1 1 auto;
        overflow-y: auto;
        padding-right: 4px;
      }
      #${PANEL_ID} .pfh-upload-scroll {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      #${PANEL_ID} .pfh-upload-section,
      #${PANEL_ID} .pfh-upload-body {
        min-height: 0;
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
      }
      #${PANEL_ID} .pfh-upload-list {
        display: flex !important;
        flex-direction: column;
        align-content: stretch;
        justify-content: flex-start;
        gap: 8px !important;
        min-height: 0;
        flex: 1 1 auto;
        height: auto;
        max-height: none !important;
        overflow-y: auto;
      }
      #${PANEL_ID} .pfh-upload-body {
        gap: 8px !important;
      }
      #${PANEL_ID} .pfh-upload-drop {
        min-height: 50px !important;
        margin: 0 !important;
      }
      #${PANEL_ID} .pfh-upload-actions {
        margin: 0 !important;
      }
      #${PANEL_ID} .pfh-upload-item {
        flex: 0 0 58px;
        height: 58px;
        grid-template-columns: minmax(0, 1.15fr) 72px minmax(0, 1fr) 34px;
      }
      #${PANEL_ID} .pfh-upload-item.is-history {
        grid-template-columns: minmax(0, 1.15fr) 72px minmax(0, 1.25fr) 34px;
      }
      #${PANEL_ID} .pfh-upload-inline-actions {
        display: flex;
        gap: 6px;
        margin-top: 4px;
      }
      #${PANEL_ID} .pfh-upload-inline-actions button {
        height: 22px;
        padding: 0 8px;
        border: 1px solid #d6dfeb;
        border-radius: 5px;
        background: #fff;
        color: #17406f;
        font-size: 12px;
      }
      #${PANEL_ID} .pfh-upload-check {
        width: 24px;
        height: 24px;
        padding: 0;
        border: 1px solid #c9d5e5;
        border-radius: 5px;
        background: #fff;
        justify-self: end;
        position: relative;
      }
      #${PANEL_ID} .pfh-upload-check.is-checked {
        border-color: #613df4;
        background: #f4f1ff;
      }
      #${PANEL_ID} .pfh-upload-check.is-checked::after {
        content: '';
        position: absolute;
        left: 7px;
        top: 4px;
        width: 7px;
        height: 12px;
        border: solid #613df4;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }
      #${PANEL_ID} .pfh-upload-time {
        display: block;
        color: #647491;
        text-align: right;
        white-space: nowrap;
      }
      #${PANEL_ID} .pfh-upload-pager {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
        min-height: 30px;
        color: #647491;
        font-size: 12px;
      }
      #${PANEL_ID} .pfh-upload-bottom {
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 0 0 auto;
      }
      #${PANEL_ID} .pfh-upload-bottom .pfh-upload-pager {
        padding: 0 4px;
      }
      #${PANEL_ID} .pfh-upload-pager > div {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-left: auto;
      }
      #${PANEL_ID} .pfh-upload-pager button,
      #${PANEL_ID} .pfh-upload-pager b,
      #${PANEL_ID} .pfh-upload-pager .pfh-pager-ellipsis {
        width: 24px;
        height: 24px;
        display: grid;
        place-items: center;
        padding: 0;
        border: 1px solid #d6dfeb;
        border-radius: 5px;
        background: #fff;
        color: #647491;
      }
      #${PANEL_ID} .pfh-upload-pager button:disabled {
        opacity: .45;
        cursor: default;
      }
      #${PANEL_ID} .pfh-upload-pager b {
        color: #613df4;
        border-color: #613df4;
      }
      #${PANEL_ID} .pfh-upload-pager .pfh-pager-ellipsis {
        border-color: transparent;
        background: transparent;
        color: #647491;
      }
      #${PANEL_ID} .pfh-sku em {
        display: inline-grid;
        place-items: center;
        width: 18px;
        height: 18px;
        padding: 0;
        color: #1b4965;
        font-size: 0;
      }
      #${PANEL_ID} .pfh-sku em .pfh-icon {
        width: 14px;
        height: 14px;
        border: 0;
        background: transparent;
      }
      #${PANEL_ID} .pfh-sku em svg {
        width: 14px;
        height: 14px;
      }
      #${PANEL_ID} .pfh-actions button.is-panel-pinned .pfh-icon-pin svg {
        transform: rotate(180deg);
      }
      #${PANEL_ID} .pfh-graphic-table {
        overflow: hidden;
        border-radius: 6px;
      }
      #${PANEL_ID} .pfh-table-head {
        display: grid;
        grid-template-columns: minmax(130px, 1fr) minmax(145px, 1.25fr) 52px;
        align-items: center;
        min-height: 42px;
        padding: 0 10px;
        color: #647491;
        background: #f5f9fe;
        border-radius: 6px 6px 0 0;
      }
      #${PANEL_ID} .pfh-graphic-table .pfh-row {
        grid-template-columns: minmax(130px, 1fr) minmax(145px, 1.25fr) 52px;
      }
      #${PANEL_ID} .pfh-graphic-table .pfh-row-actions {
        justify-content: center;
      }
      #${PANEL_ID} .pfh-note {
        flex: 0 0 auto;
        margin-top: auto !important;
      }
      #${PANEL_ID} .pfh-note-source {
        min-width: 180px;
        flex: 1 1 auto;
      }
      #${PANEL_ID} .pfh-note-toast {
        display: none;
        flex: 0 1 230px;
        margin-left: auto;
        color: #137333;
        text-align: left;
        white-space: normal;
        overflow: visible;
        text-overflow: clip;
        overflow-wrap: anywhere;
        line-height: 1.35;
      }
      #${PANEL_ID} .pfh-note-toast.is-visible {
        display: block;
      }
      #${PANEL_ID} .pfh-toast {
        display: none !important;
      }
      #${PANEL_ID} .pfh-icon-refresh svg {
        fill: currentColor !important;
        stroke: none !important;
      }
      #${PANEL_ID} .pfh-resize-handle {
        position: absolute;
        z-index: 3;
        opacity: 0;
      }
      #${PANEL_ID} .pfh-resize-n,
      #${PANEL_ID} .pfh-resize-s {
        left: 12px;
        right: 12px;
        height: 8px;
        cursor: ns-resize;
      }
      #${PANEL_ID} .pfh-resize-n { top: -3px; }
      #${PANEL_ID} .pfh-resize-s { bottom: -3px; }
      #${PANEL_ID} .pfh-resize-e,
      #${PANEL_ID} .pfh-resize-w {
        top: 12px;
        bottom: 12px;
        width: 8px;
        cursor: ew-resize;
      }
      #${PANEL_ID} .pfh-resize-e { right: -3px; }
      #${PANEL_ID} .pfh-resize-w { left: -3px; }
      #${PANEL_ID} .pfh-resize-ne,
      #${PANEL_ID} .pfh-resize-nw,
      #${PANEL_ID} .pfh-resize-se,
      #${PANEL_ID} .pfh-resize-sw {
        width: 16px;
        height: 16px;
      }
      #${PANEL_ID} .pfh-resize-ne {
        top: -3px;
        right: -3px;
        cursor: nesw-resize;
      }
      #${PANEL_ID} .pfh-resize-nw {
        top: -3px;
        left: -3px;
        cursor: nwse-resize;
      }
      #${PANEL_ID} .pfh-resize-se {
        right: 2px;
        bottom: 2px;
        cursor: nwse-resize;
        opacity: .28;
        background: linear-gradient(135deg, transparent 0 45%, #64748b 45% 55%, transparent 55% 100%);
      }
      #${PANEL_ID} .pfh-resize-sw {
        left: -3px;
        bottom: -3px;
        cursor: nesw-resize;
      }
      #${PANEL_ID},
      #${PANEL_ID} * {
        font-weight: 400 !important;
      }
      #${PANEL_ID} .pfh-row,
      #${PANEL_ID} .pfh-setting-row,
      #${PANEL_ID} .pfh-upload-item,
      #${PANEL_ID} .pfh-upload-table-head,
      #${PANEL_ID} .pfh-upload-bottom {
        user-select: none;
      }
      #${PANEL_ID} .pfh-value,
      #${PANEL_ID} .pfh-title-meta,
      #${PANEL_ID} .pfh-search,
      #${PANEL_ID} .pfh-note-source,
      #${PANEL_ID} .pfh-about-note strong,
      #${PANEL_ID} .pfh-about-note p,
      #${PANEL_ID} .pfh-easter-egg,
      #${PANEL_ID} .pfh-setting-row > span {
        user-select: text;
      }
      #${PANEL_ID} .pfh-setting-row label,
      #${PANEL_ID} .pfh-about-actions,
      #${PANEL_ID} .pfh-about-actions button {
        user-select: none;
      }
      #${PANEL_ID} .pfh-warning-note {
        order: -1;
        margin-top: 0;
      }
      #${PANEL_ID} .pfh-warning-note strong,
      #${PANEL_ID} .pfh-warning-note p {
        font-weight: 700 !important;
      }
      #${PANEL_ID} .pfh-upload-table-head.is-history {
        grid-template-columns: minmax(0, 1.2fr) 82px minmax(106px, 1fr) 40px;
        min-height: 48px;
        padding: 0 12px;
        font-size: 13px;
      }
      #${PANEL_ID} .pfh-upload-item.is-history {
        grid-template-columns: minmax(0, 1.2fr) 82px minmax(106px, 1fr) 40px;
      }
      #${PANEL_ID} .pfh-upload-check {
        width: 18px !important;
        height: 18px !important;
        border-radius: 5px;
        justify-self: center;
      }
      #${PANEL_ID} .pfh-upload-check.is-checked::after {
        left: 5px !important;
        top: 2px !important;
        width: 5px !important;
        height: 9px !important;
        border-width: 0 2px 2px 0;
      }
      #${PANEL_ID} .pfh-upload-bottom-line {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      #${PANEL_ID} .pfh-upload-bottom-actions {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-left: auto;
        margin-right: 8px;
      }
      #${PANEL_ID} .pfh-upload-bottom-actions button {
        min-width: 52px;
        height: 26px;
        min-height: 26px;
        padding: 0 10px;
        color: #17406f;
        background: #fff;
        border: 1px solid #d6dfeb;
        border-radius: 6px;
        font-size: 12px;
        line-height: 24px;
      }
      #${PANEL_ID} .pfh-upload-bottom-actions button:disabled {
        color: #94a3b8;
        background: #f8fafc;
        cursor: default;
      }
      #${PANEL_ID} .pfh-sku.is-pinned:not(.is-active) {
        border-color: #d6dfeb !important;
        background: #fff !important;
      }
      #${PANEL_ID} .pfh-sku.is-pinned.is-active {
        border-color: #f59e0b !important;
        background: #fffbeb !important;
      }
      #${PANEL_ID} .pfh-excel-form.is-open {
        flex: 0 0 auto;
        max-width: none;
      }
      #${PANEL_ID} .pfh-excel-form.is-open input {
        width: 68px;
        flex: 0 0 68px;
        border-radius: 10px;
        background: rgba(255,255,255,.74);
      }
      #${PANEL_ID} .pfh-excel-form.is-open select {
        border-radius: 10px;
        background: rgba(255,255,255,.74);
      }
      #${PANEL_ID} .pfh-excel-form.is-open > button[data-action="excel-prepare"] {
        min-width: 34px !important;
        width: 34px;
        height: 28px;
        min-height: 28px;
        flex: 0 0 34px;
        padding: 0 !important;
        border-radius: 10px;
        background: rgba(255,255,255,.76);
        border: 1px solid rgba(211,204,255,.56);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.9);
      }
      #${PANEL_ID} .pfh-excel-controls > button[data-action="excel-prepare"] .pfh-icon,
      #${PANEL_ID} .pfh-excel-controls > button[data-action="excel-prepare"] svg,
      #${PANEL_ID} .pfh-note button .pfh-icon,
      #${PANEL_ID} .pfh-note button svg {
        background: transparent !important;
      }
      #${PANEL_ID} .pfh-excel-status {
        color: #6d35e8;
        font-weight: 700;
      }
      #${PANEL_ID} .pfh-excel-status.is-good {
        color: #0f8a4e;
      }
      #${PANEL_ID} .pfh-excel-status.is-bad {
        color: #b42318;
      }
      #${PANEL_ID} {
        --pfh-purple: #7c3aed;
        --pfh-purple-2: #a78bfa;
        --pfh-ink: #14162f;
        --pfh-muted: #7d86a8;
        --pfh-line: rgba(164, 149, 255, 0.22);
        --pfh-glass: rgba(255, 255, 255, 0.74);
        width: 900px;
        color: var(--pfh-ink);
        background:
          radial-gradient(circle at 16% 0%, rgba(124, 58, 237, 0.12), transparent 34%),
          radial-gradient(circle at 86% 100%, rgba(14, 165, 233, 0.12), transparent 34%),
          rgba(255, 255, 255, 0.78);
        border: 1px solid rgba(211, 204, 255, 0.62);
        border-radius: 16px;
        box-shadow: 0 22px 70px rgba(64, 52, 134, 0.18), inset 0 1px 0 rgba(255,255,255,0.86);
        backdrop-filter: blur(18px) saturate(1.22);
      }
      #${PANEL_ID} * {
        letter-spacing: 0 !important;
      }
      #${PANEL_ID} .pfh-header {
        min-height: 76px;
        padding: 16px 20px;
        background: rgba(255, 255, 255, 0.58);
        border-bottom: 1px solid rgba(211, 204, 255, 0.38);
      }
      #${PANEL_ID} .pfh-heading strong {
        min-width: 132px !important;
        padding-left: 42px;
        color: #16163a;
        font-size: 18px;
      }
      #${PANEL_ID} .pfh-heading strong::before {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: linear-gradient(145deg, #8b5cf6, #6d35e8);
        box-shadow: 0 12px 24px rgba(124, 58, 237, .26);
      }
      #${PANEL_ID} .pfh-heading strong::after {
        content: 'P';
        left: 10px;
        width: auto;
        height: auto;
        color: #fff;
        background: transparent;
        box-shadow: none;
        border-radius: 0;
        transform: translateY(-50%);
        font-size: 17px;
        font-weight: 800 !important;
      }
      #${PANEL_ID} .pfh-search-input {
        height: 36px;
        border: 1px solid rgba(171, 160, 231, 0.34);
        border-radius: 12px 0 0 12px;
        background: rgba(255, 255, 255, 0.72);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.9);
      }
      #${PANEL_ID} .pfh-search > button,
      #${PANEL_ID} .pfh-excel-controls > button[data-action="excel-generate"],
      #${PANEL_ID} .pfh-tutorial-actions button:first-child {
        height: 36px;
        border-color: transparent;
        border-radius: 0 12px 12px 0;
        color: #fff;
        background: linear-gradient(135deg, #8b5cf6, #6d35e8);
        box-shadow: 0 12px 26px rgba(124, 58, 237, 0.26);
      }
      #${PANEL_ID} button {
        transition: transform 260ms cubic-bezier(.2, .9, .18, 1.18), box-shadow 260ms cubic-bezier(.2, .9, .18, 1.18), border-color 180ms ease, background 180ms ease;
      }
      #${PANEL_ID} .pfh-actions button {
        width: 50px !important;
        color: #302a5e;
      }
      #${PANEL_ID} .pfh-actions .pfh-icon,
      #${PANEL_ID} .pfh-toolrow .pfh-icon {
        border: 1px solid rgba(183, 172, 255, 0.34);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.72);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.88);
      }
      #${PANEL_ID} .pfh-actions button:hover {
        transform: translateY(-2px);
      }
      #${PANEL_ID} .pfh-main {
        background: linear-gradient(145deg, rgba(247, 244, 255, .72), rgba(236, 250, 255, .52));
        padding: 16px 18px 18px;
      }
      #${PANEL_ID} .pfh-list,
      #${PANEL_ID} .pfh-detail {
        background: rgba(255,255,255,.62);
        border: 1px solid rgba(211, 204, 255, 0.42);
        border-radius: 14px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.86);
      }
      #${PANEL_ID} .pfh-sku {
        border-radius: 12px;
        background: rgba(255,255,255,.64);
      }
      #${PANEL_ID} .pfh-sku:hover {
        transform: translateY(-1px);
        border-color: rgba(124, 58, 237, .42);
        box-shadow: 0 10px 24px rgba(124, 58, 237, .10);
      }
      #${PANEL_ID} .pfh-sku.is-active {
        border-color: rgba(124, 58, 237, .48) !important;
        background: rgba(247, 242, 255, .86) !important;
        box-shadow: 0 10px 26px rgba(124, 58, 237, .13);
      }
      #${PANEL_ID} .pfh-home {
        min-height: 100%;
        display: grid;
        align-content: center;
        justify-items: center;
        padding: 26px 28px 34px;
        text-align: center;
      }
      #${PANEL_ID} .pfh-home-orbit {
        position: relative;
        width: 92px;
        height: 92px;
        display: grid;
        place-items: center;
        margin-bottom: 18px;
        border-radius: 50%;
        background: rgba(255,255,255,.48);
        border: 1px solid rgba(167,139,250,.34);
        box-shadow: 0 0 34px rgba(124,58,237,.16);
        animation: pfh-home-pulse 2.4s cubic-bezier(.2,.9,.18,1) infinite;
      }
      #${PANEL_ID} .pfh-home-orbit::before,
      #${PANEL_ID} .pfh-home-orbit::after {
        content: '';
        position: absolute;
        inset: 15px;
        border-radius: 50%;
        border: 1px solid rgba(124,58,237,.16);
      }
      #${PANEL_ID} .pfh-home-orbit::after {
        inset: 30px;
        background: linear-gradient(135deg, #8b5cf6, #a78bfa);
        border: 0;
        box-shadow: 0 0 18px rgba(124,58,237,.36);
      }
      #${PANEL_ID} .pfh-home h2 {
        margin: 0;
        color: #17153f;
        font-size: 25px;
        line-height: 1.25;
        font-weight: 760 !important;
      }
      #${PANEL_ID} .pfh-home p {
        max-width: 530px;
        margin: 12px 0 16px;
        color: #66709a;
        font-size: 14px;
        line-height: 1.8;
      }
      #${PANEL_ID} .pfh-home-stats {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 30px;
        padding: 0 12px;
        margin-bottom: 22px;
        color: #6d35e8;
        background: rgba(255,255,255,.62);
        border: 1px solid rgba(167,139,250,.28);
        border-radius: 999px;
      }
      #${PANEL_ID} .pfh-home-stats span,
      #${PANEL_ID} .pfh-home-stats em {
        color: #8b91b2;
        font-size: 11px;
        font-style: normal;
      }
      #${PANEL_ID} .pfh-home-stats b {
        font-size: 13px;
        font-weight: 760 !important;
      }
      #${PANEL_ID} .pfh-home-grid {
        width: min(100%, 680px);
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }
      #${PANEL_ID} .pfh-home-card {
        min-height: 156px;
        display: grid;
        grid-template-rows: 42px auto auto 1fr;
        justify-items: center;
        gap: 8px;
        padding: 18px 14px;
        border: 1px solid rgba(197, 186, 255, .34);
        border-radius: 16px;
        background: linear-gradient(180deg, rgba(255,255,255,.78), rgba(255,255,255,.48));
        box-shadow: inset 0 1px 0 rgba(255,255,255,.88);
        white-space: normal;
      }
      #${PANEL_ID} .pfh-home-card:hover {
        transform: translateY(-2px);
        border-color: rgba(124, 58, 237, .42);
        box-shadow: 0 16px 36px rgba(124, 58, 237, .17), inset 0 1px 0 rgba(255,255,255,.94);
      }
      #${PANEL_ID} .pfh-home-card.is-disabled,
      #${PANEL_ID} .pfh-home-card:disabled {
        cursor: not-allowed;
        opacity: .48;
        filter: grayscale(.38);
        box-shadow: none;
      }
      #${PANEL_ID} .pfh-home-card.is-disabled:hover,
      #${PANEL_ID} .pfh-home-card:disabled:hover {
        transform: none;
        border-color: rgba(197, 186, 255, .34);
        box-shadow: none;
      }
      #${PANEL_ID} .pfh-home-card .pfh-icon {
        width: 42px;
        height: 42px;
        border-radius: 13px;
        color: #7c3aed;
        background: rgba(248,245,255,.9);
        border-color: rgba(167,139,250,.28);
      }
      #${PANEL_ID} .pfh-home-card .pfh-icon svg {
        width: 22px;
        height: 22px;
        fill: currentColor;
        stroke: currentColor;
      }
      #${PANEL_ID} .pfh-home-card small {
        color: #8b91b2;
        font-size: 11px;
        font-weight: 620 !important;
      }
      #${PANEL_ID} .pfh-home-card strong {
        color: #21194f;
        font-size: 14px;
        font-weight: 760 !important;
      }
      #${PANEL_ID} .pfh-home-card span {
        color: #737b9f;
        font-size: 12px;
        line-height: 1.55;
      }
      #${PANEL_ID} .pfh-product-hero {
        margin-bottom: 12px;
      }
      #${PANEL_ID} .pfh-title-meta {
        min-height: 102px;
        display: grid;
        grid-template-columns: 72px minmax(0, 1fr);
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        color: #15143b;
        background: rgba(255,255,255,.66);
        border: 1px solid rgba(211, 204, 255, .38);
        border-radius: 16px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.88);
        cursor: pointer;
        overflow: visible;
      }
      #${PANEL_ID} .pfh-title-meta:hover {
        background: rgba(255,255,255,.82);
        border-color: rgba(124, 58, 237, .34);
      }
      #${PANEL_ID} .pfh-product-hero {
        overflow: visible;
      }
      #${PANEL_ID} .pfh-product-thumb {
        width: 58px;
        height: 58px;
        display: grid;
        place-items: center;
        overflow: visible;
        position: relative;
        padding: 0;
        border: 0;
        border-radius: 14px;
        background: transparent;
        transition: transform 260ms cubic-bezier(.2,.9,.18,1.18), box-shadow 220ms ease;
        transform-origin: left center;
      }
      #${PANEL_ID} .pfh-product-thumb:hover {
        transform: none;
        z-index: 30;
        box-shadow: none;
        overflow: visible;
      }
      #${PANEL_ID} .pfh-product-thumb img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
        background: #fff;
      }
      #${PANEL_ID} .pfh-product-thumb.is-empty .pfh-icon {
        border: 0;
        background: transparent;
        color: #7c3aed;
      }
      #${PANEL_ID} .pfh-product-title-copy {
        min-width: 0;
        display: grid;
        gap: 4px;
        text-align: left;
      }
      #${PANEL_ID} .pfh-product-title-copy span {
        width: max-content;
        max-width: 100%;
        padding: 4px 9px;
        color: #fff;
        background: linear-gradient(135deg, #8b5cf6, #6d35e8);
        border-radius: 9px;
        font-size: 11px;
        font-weight: 760 !important;
      }
      #${PANEL_ID} .pfh-product-title-copy strong {
        overflow: hidden;
        color: #18153f;
        font-size: 15px;
        line-height: 1.35;
        font-weight: 760 !important;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #${PANEL_ID} .pfh-product-title-copy em {
        color: #8b91b2;
        font-size: 11px;
        font-style: normal;
      }
      #${PANEL_ID} .pfh-product-title-copy {
        gap: 2px;
      }
      #${PANEL_ID} .pfh-product-title-copy strong {
        white-space: normal;
      }
      #${PANEL_ID} .pfh-product-title-copy em:last-child {
        display: block;
      }
      #${PANEL_ID} .pfh-product-title-copy span[data-action="copy-sku"] {
        cursor: pointer;
      }
      #${PANEL_ID} .pfh-product-title-copy strong[data-action="copy-title-meta"] {
        cursor: pointer;
      }
      #${PANEL_ID} .pfh-about-section,
      #${PANEL_ID} .pfh-upload-section,
      #${PANEL_ID} .pfh-home {
        padding: 18px 18px 16px;
        background: rgba(255,255,255,.72);
        border: 1px solid rgba(211, 204, 255, .34);
        border-radius: 16px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.88);
      }
      #${PANEL_ID} .pfh-home {
        min-height: calc(100% - 6px);
        display: grid;
        align-content: start;
        gap: 12px;
      }
      #${PANEL_ID} .pfh-home-orbit {
        width: 124px;
        height: 124px;
      }
      #${PANEL_ID} .pfh-home h2 {
        margin-top: 2px;
        font-size: 20px;
        letter-spacing: 0;
      }
      #${PANEL_ID} .pfh-home p {
        max-width: 54ch;
        color: #5b6583;
      }
      #${PANEL_ID} .pfh-home-card {
        min-height: 128px;
        padding: 14px;
        background: rgba(255,255,255,.84);
        border: 1px solid rgba(211, 204, 255, .30);
        border-radius: 14px;
        overflow: hidden;
      }
      #${PANEL_ID} .pfh-home-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 16px 32px rgba(124,58,237,.12), 0 0 0 1px rgba(124,58,237,.14);
      }
      #${PANEL_ID} .pfh-about-actions button,
      #${PANEL_ID} .pfh-upload-actions button,
      #${PANEL_ID} .pfh-upload-bottom-actions button,
      #${PANEL_ID} .pfh-excel-controls button {
        border-radius: 10px;
      }
      #${PANEL_ID} .pfh-section-title .pfh-excel-controls > button[data-action="excel-prepare"] {
        min-width: 82px;
        height: 34px;
        padding: 0 14px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }
      #${PANEL_ID} .pfh-section-title .pfh-excel-controls > button[data-action="excel-prepare"] .pfh-icon {
        width: 14px;
        height: 14px;
      }
      #${PANEL_ID} .pfh-section-title .pfh-excel-controls > button[data-action="excel-prepare"] svg {
        width: 14px;
        height: 14px;
      }
      #${PANEL_ID} .pfh-cloud-backup {
        background: rgba(255,255,255,.82);
      }
      #${PANEL_ID} .pfh-setting-row {
        background: rgba(255,255,255,.60);
        border: 1px solid rgba(226, 232, 240, .88);
        border-radius: 14px;
        padding: 10px 12px;
      }
      #${PANEL_ID} .pfh-setting-row label {
        border-radius: 10px;
        background: rgba(248,250,252,.96);
      }
      #${PANEL_ID} .pfh-home-grid {
        width: min(100%, 860px);
      }
      #${PANEL_ID} .pfh-home-card strong,
      #${PANEL_ID} .pfh-home-card span {
        display: block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      #${PANEL_ID} .pfh-upload-table-head,
      #${PANEL_ID} .pfh-upload-item {
        border-radius: 12px;
      }
      #${PANEL_ID} .pfh-upload-table-head {
        background: rgba(255,255,255,.66);
      }
      #${PANEL_ID} .pfh-upload-item {
        background: rgba(255,255,255,.78);
      }
      #${PANEL_ID} .pfh-detail {
        overflow: hidden !important;
      }
      #${PANEL_ID} .pfh-detail-scroll {
        overflow-x: hidden;
        overflow-y: auto;
        padding-bottom: 12px;
      }
      #${PANEL_ID} .pfh-file-section,
      #${PANEL_ID} .pfh-product-hero,
      #${PANEL_ID} .pfh-title-meta {
        overflow: visible !important;
      }
      #${PANEL_ID} .pfh-product-hero {
        position: relative;
        z-index: 5;
      }
      #${PANEL_ID} .pfh-product-thumb {
        position: relative;
        display: grid;
        place-items: center;
        transform-origin: left top;
        padding: 0;
        border: 0;
        background: transparent;
        box-shadow: none;
        overflow: visible;
      }
      #${PANEL_ID} .pfh-product-thumb:hover {
        transform: none;
        z-index: 100;
        box-shadow: none;
        overflow: visible;
      }
      #${PANEL_ID} .pfh-thumb-frame {
        width: 58px;
        height: 58px;
        display: grid;
        place-items: center;
        overflow: hidden;
        border-radius: 14px;
        background: #fff;
        border: 1px solid rgba(199, 190, 255, .46);
      }
      #${PANEL_ID} .pfh-thumb-preview {
        position: absolute;
        left: 0;
        top: 0;
        width: 58px;
        height: 58px;
        display: grid;
        place-items: center;
        padding: 0;
        background: #fff;
        border: 1px solid rgba(167, 139, 250, .42);
        border-radius: 15px;
        box-shadow: 0 7px 16px rgba(79, 70, 229, .12);
        overflow: hidden;
        box-sizing: border-box;
        opacity: 0;
        pointer-events: none;
        transform: translate3d(0, 0, 0) scale(.96);
        transform-origin: left top;
        transition:
          opacity 120ms ease,
          width 360ms cubic-bezier(.16, 1.18, .32, 1),
          height 360ms cubic-bezier(.16, 1.18, .32, 1),
          transform 360ms cubic-bezier(.16, 1.18, .32, 1),
          box-shadow 220ms ease;
      }
      #${PANEL_ID} .pfh-product-thumb:hover .pfh-thumb-preview {
        width: 252px;
        height: 252px;
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
      }
      #${PANEL_ID} .pfh-thumb-frame img,
      #${PANEL_ID} .pfh-thumb-preview img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: inherit;
        overflow: hidden;
      }
      #${PANEL_ID} .pfh-note,
      #${PANEL_ID} .pfh-upload-bottom {
        flex: 0 0 auto;
        position: relative;
        bottom: auto;
        z-index: 20;
        margin-top: 0;
      }
      #${PANEL_ID} .pfh-detail {
        display: grid !important;
        grid-template-rows: minmax(0, 1fr) auto;
      }
      #${PANEL_ID} .pfh-detail > .pfh-detail-scroll,
      #${PANEL_ID} .pfh-detail > .pfh-upload-scroll {
        min-height: 0;
      }
      #${PANEL_ID} .pfh-list-pager {
        flex: 0 0 auto;
        position: sticky;
        bottom: 0;
        z-index: 12;
        background: rgba(255, 255, 255, .88);
        backdrop-filter: blur(10px);
      }
      #${PANEL_ID} .pfh-list-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
      }
      #${PANEL_ID} .pfh-list-head span {
        margin-left: 8px;
        color: #6b7897;
        font-size: 12px;
        font-weight: 720 !important;
      }
      #${PANEL_ID} .pfh-list-pager {
        justify-content: center;
        padding-top: 10px;
        overflow: hidden;
      }
      #${PANEL_ID} .pfh-list-pager > div {
        margin-left: 0;
        justify-content: center;
        flex-wrap: nowrap;
        max-width: 100%;
        overflow: hidden;
      }
      #${PANEL_ID} .pfh-list-pager button,
      #${PANEL_ID} .pfh-list-pager b,
      #${PANEL_ID} .pfh-list-pager .pfh-pager-ellipsis {
        width: 24px;
        height: 24px;
        display: grid;
        place-items: center;
      }
      #${PANEL_ID} .pfh-home-card .pfh-icon {
        display: grid !important;
        place-items: center !important;
        padding: 0 !important;
        line-height: 1;
      }
      #${PANEL_ID} .pfh-home-card .pfh-icon svg {
        display: block;
        margin: auto;
        fill: currentColor !important;
        stroke: currentColor !important;
      }
      #${PANEL_ID} .pfh-home-card .pfh-icon svg path {
        fill: currentColor !important;
        stroke: none !important;
      }
      #${PANEL_ID} .pfh-home-orbit {
        isolation: isolate;
        overflow: hidden;
        background: radial-gradient(circle at 50% 50%, rgba(255,255,255,.96) 0 26%, rgba(248,245,255,.68) 27% 45%, rgba(255,255,255,.20) 46% 100%);
        border-color: rgba(196,181,253,.34);
        box-shadow: 0 18px 60px rgba(124,58,237,.12), inset 0 1px 0 rgba(255,255,255,.95);
        animation: pfh-home-glass-float 4.8s cubic-bezier(.2,.8,.2,1) infinite;
      }
      #${PANEL_ID} .pfh-home-orbit .wave {
        position: absolute;
        inset: 8px;
        border-radius: 50%;
        border: 1px solid rgba(139,92,246,.24);
        background: radial-gradient(circle, rgba(139,92,246,.13), rgba(139,92,246,0) 62%);
        opacity: 0;
        animation: pfh-ripple 2.4s ease-out infinite;
      }
      #${PANEL_ID} .pfh-home-orbit .wave:nth-child(2) { animation-delay: .8s; }
      #${PANEL_ID} .pfh-home-orbit .wave:nth-child(3) { animation-delay: 1.6s; }
      #${PANEL_ID} .pfh-home-orbit i {
        pointer-events: none;
      }
      #${PANEL_ID} .pfh-home-orbit span {
        position: absolute;
        inset: 34px;
        z-index: 3;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(139,92,246,.92), rgba(167,139,250,.74));
        box-shadow: 0 10px 28px rgba(124,58,237,.22), inset 0 1px 0 rgba(255,255,255,.48);
      }
      #${PANEL_ID} .pfh-home-orbit::before {
        inset: 8px;
        border: 1px solid rgba(167,139,250,.22);
        background: conic-gradient(from 110deg, rgba(139,92,246,0), rgba(139,92,246,.22), rgba(139,92,246,0) 34%, rgba(255,255,255,.55) 52%, rgba(139,92,246,0) 70%);
        -webkit-mask: radial-gradient(circle, transparent 58%, #000 59%);
        mask: radial-gradient(circle, transparent 58%, #000 59%);
        animation: pfh-home-orbit-spin 6.5s linear infinite;
        z-index: 2;
      }
      #${PANEL_ID} .pfh-home-orbit::after {
        inset: 20px;
        border: 1px solid rgba(196,181,253,.36);
        background: rgba(255,255,255,.18);
        box-shadow: inset 0 0 18px rgba(124,58,237,.08);
        z-index: 1;
      }
      #${PANEL_ID} .pfh-excel-controls > button[data-action="excel-generate"] {
        border-radius: 12px !important;
      }
      #${PANEL_ID} .pfh-upload-side {
        display: grid;
        gap: 12px;
      }
      #${PANEL_ID} .pfh-upload-side-card,
      #${PANEL_ID} .pfh-upload-guide {
        width: 100%;
        padding: 14px;
        text-align: left;
        border: 1px solid rgba(211, 204, 255, .34);
        border-radius: 14px;
        background: rgba(255,255,255,.70);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.88);
      }
      #${PANEL_ID} .pfh-upload-side-card {
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr);
        gap: 4px 10px;
        align-items: center;
      }
      #${PANEL_ID} .pfh-upload-side-card .pfh-icon {
        grid-row: 1 / span 2;
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        color: #6d35e8;
        border: 1px solid rgba(167,139,250,.28);
        border-radius: 10px;
        background: rgba(248,245,255,.86);
      }
      #${PANEL_ID} .pfh-upload-side-card .pfh-icon svg {
        width: 19px;
        height: 19px;
        color: currentColor;
        fill: currentColor;
        stroke: currentColor;
        transition: color .18s ease, transform .18s ease;
      }
      #${PANEL_ID} .pfh-upload-side-card .pfh-icon svg * {
        fill: currentColor;
        stroke: currentColor;
      }
      #${PANEL_ID} .pfh-upload-side-card:hover {
        color: #6d35e8;
        border-color: rgba(124, 58, 237, .18);
        background: rgba(255,255,255,.84);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.92), 0 10px 22px rgba(124,58,237,.10);
      }
      #${PANEL_ID} .pfh-upload-side-card:hover .pfh-icon {
        color: #6d35e8;
        border-color: rgba(124, 58, 237, .20);
        background: rgba(124, 58, 237, .10);
      }
      #${PANEL_ID} .pfh-upload-side-card:hover .pfh-icon svg {
        transform: translateY(-1px);
      }
      #${PANEL_ID} .pfh-upload-side-card strong,
      #${PANEL_ID} .pfh-upload-guide b {
        color: #17153f;
        font-size: 13px;
        font-weight: 800 !important;
      }
      #${PANEL_ID} .pfh-upload-side-card span,
      #${PANEL_ID} .pfh-upload-guide p {
        margin: 0;
        color: #6b7897;
        font-size: 12px;
        line-height: 1.55;
      }
      #${PANEL_ID} .pfh-upload-guide {
        align-self: start;
      }
      #${PANEL_ID} .pfh-upload-guide p {
        margin-top: 8px;
      }
      #${PANEL_ID} .pfh-row,
      #${PANEL_ID} .pfh-table-head,
      #${PANEL_ID} .pfh-note,
      #${PANEL_ID} .pfh-upload-item,
      #${PANEL_ID} .pfh-upload-table-head,
      #${PANEL_ID} .pfh-cloud-backup,
      #${PANEL_ID} .pfh-about-note {
        border-color: rgba(211, 204, 255, .30);
        background-color: rgba(255,255,255,.52);
        border-radius: 12px;
      }
      #${PANEL_ID} .pfh-main {
        gap: 10px;
        background: linear-gradient(145deg, rgba(247,244,255,.56), rgba(241,250,255,.42));
      }
      #${PANEL_ID} .pfh-list,
      #${PANEL_ID} .pfh-detail {
        background: rgba(255,255,255,.72) !important;
        border: 1px solid rgba(211,204,255,.34) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.82) !important;
      }
      #${PANEL_ID} .pfh-detail-scroll {
        padding: 16px 16px 0 !important;
      }
      #${PANEL_ID} .pfh-section,
      #${PANEL_ID} .pfh-file-section,
      #${PANEL_ID} .pfh-product-hero,
      #${PANEL_ID} .pfh-title-meta,
      #${PANEL_ID} .pfh-graphic-table {
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
      }
      #${PANEL_ID} .pfh-section {
        padding: 0 !important;
        margin: 0 !important;
      }
      #${PANEL_ID} .pfh-file-section {
        margin-bottom: 22px !important;
      }
      #${PANEL_ID} .pfh-title-meta {
        min-height: 126px;
        justify-content: center;
        border: 1px solid rgba(211,204,255,.30) !important;
        border-radius: 16px !important;
        background: rgba(255,255,255,.54) !important;
      }
      #${PANEL_ID} .pfh-title-meta:hover {
        background: rgba(255,255,255,.68) !important;
      }
      #${PANEL_ID} .pfh-row,
      #${PANEL_ID} .pfh-graphic-table .pfh-row,
      #${PANEL_ID} .pfh-table-head {
        min-height: 50px;
        margin: 0 !important;
        border: 0 !important;
        border-bottom: 1px solid rgba(211,204,255,.24) !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      #${PANEL_ID} .pfh-table-head {
        min-height: 40px;
        color: #7180a1;
        font-weight: 800 !important;
      }
      #${PANEL_ID} .pfh-row:last-child,
      #${PANEL_ID} .pfh-graphic-table .pfh-row:last-child {
        border-bottom: 0 !important;
      }
      #${PANEL_ID} .pfh-row-actions button,
      #${PANEL_ID} .pfh-note button {
        background: rgba(255,255,255,.74) !important;
        border: 1px solid rgba(211,204,255,.44) !important;
        box-shadow: none !important;
      }
      #${PANEL_ID} .pfh-note {
        margin: 6px 0 0 !important;
        padding: 8px 0 0 !important;
        border: 0 !important;
        border-top: 1px solid rgba(211,204,255,.24) !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      #${PANEL_ID} .pfh-list-head,
      #${PANEL_ID} .pfh-list-pager {
        background: transparent !important;
        backdrop-filter: none !important;
      }
      #${PANEL_ID} .pfh-list-pager {
        border-top: 1px solid rgba(211,204,255,.22);
      }
      #${PANEL_ID} .pfh-sku {
        box-shadow: none !important;
      }
      #${PANEL_ID} .pfh-sku:hover,
      #${PANEL_ID} .pfh-sku.is-active {
        box-shadow: 0 10px 22px rgba(124,58,237,.10) !important;
      }
      #${PANEL_ID} {
        overflow: hidden !important;
        isolation: isolate;
      }
      #${PANEL_ID} > .pfh-full {
        height: 100%;
        max-height: inherit;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: inherit;
        background:
          radial-gradient(circle at 16% 0%, rgba(124, 58, 237, 0.10), transparent 34%),
          radial-gradient(circle at 86% 100%, rgba(14, 165, 233, 0.10), transparent 34%),
          rgba(255,255,255,.84);
      }
      #${PANEL_ID} .pfh-header {
        flex: 0 0 auto;
        border-radius: 0 !important;
      }
      #${PANEL_ID} .pfh-main {
        flex: 1 1 auto;
        min-height: 0;
        height: auto;
        border-radius: 0 !important;
        background: transparent !important;
      }
      #${PANEL_ID} .pfh-list,
      #${PANEL_ID} .pfh-detail {
        align-self: stretch;
        min-height: 0;
        background: rgba(255,255,255,.58) !important;
      }
      #${PANEL_ID} .pfh-list {
        border-radius: 14px 0 0 14px !important;
      }
      #${PANEL_ID} .pfh-detail {
        border-radius: 0 14px 14px 0 !important;
      }
      #${PANEL_ID} .pfh-main.is-home .pfh-detail,
      #${PANEL_ID} .pfh-main.is-full .pfh-detail {
        border-radius: 14px !important;
      }
      #${PANEL_ID} .pfh-detail-scroll,
      #${PANEL_ID} .pfh-sku-scroll {
        background: transparent !important;
      }
      #${PANEL_ID} .pfh-main {
        grid-template-columns: minmax(150px, var(--pfh-list-width, 244px)) 6px minmax(0, 1fr);
        gap: 4px !important;
        padding: 14px !important;
      }
      #${PANEL_ID} .pfh-splitter {
        position: relative;
        z-index: 30;
        width: 6px !important;
        background: transparent !important;
      }
      #${PANEL_ID} .pfh-splitter::before {
        content: '';
        position: absolute;
        inset: 0 -4px;
        cursor: col-resize;
      }
      #${PANEL_ID} .pfh-splitter.is-dragging,
      #${PANEL_ID} .pfh-splitter:hover {
        background: linear-gradient(to right, transparent 0 1px, rgba(124,58,237,.18) 1px 3px, transparent 3px) !important;
      }
      #${PANEL_ID} .pfh-list,
      #${PANEL_ID} .pfh-detail,
      #${PANEL_ID} .pfh-main.is-home .pfh-detail,
      #${PANEL_ID} .pfh-main.is-full .pfh-detail {
        border-radius: 14px !important;
      }
      #${PANEL_ID} .pfh-detail-scroll {
        padding: 12px 14px 0 !important;
      }
      #${PANEL_ID} .pfh-title-meta {
        min-height: 112px;
      }
      #${PANEL_ID} .pfh-file-section {
        margin-bottom: 16px !important;
      }
      #${PANEL_ID} .pfh-row,
      #${PANEL_ID} .pfh-graphic-table .pfh-row {
        min-height: 40px !important;
        padding-top: 6px !important;
        padding-bottom: 6px !important;
      }
      #${PANEL_ID} .pfh-table-head {
        min-height: 34px !important;
        padding-top: 4px !important;
        padding-bottom: 4px !important;
      }
      #${PANEL_ID} .pfh-section-title {
        margin: 0 0 8px !important;
      }
      #${PANEL_ID} .pfh-note {
        padding-top: 6px !important;
      }
      #${PANEL_ID} .pfh-resize-handle {
        z-index: 80;
        pointer-events: auto;
      }
      #${PANEL_ID} .pfh-resize-n {
        top: 0 !important;
        height: 12px !important;
      }
      #${PANEL_ID} .pfh-resize-s {
        bottom: 0 !important;
        height: 12px !important;
      }
      #${PANEL_ID} .pfh-resize-e {
        right: 0 !important;
        width: 12px !important;
      }
      #${PANEL_ID} .pfh-resize-w {
        left: 0 !important;
        width: 12px !important;
      }
      #${PANEL_ID} .pfh-resize-ne {
        top: 0 !important;
        right: 0 !important;
      }
      #${PANEL_ID} .pfh-resize-nw {
        top: 0 !important;
        left: 0 !important;
      }
      #${PANEL_ID} .pfh-resize-se {
        right: 0 !important;
        bottom: 0 !important;
      }
      #${PANEL_ID} .pfh-resize-sw {
        left: 0 !important;
        bottom: 0 !important;
      }
      @keyframes pfh-home-pulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(124,58,237,.14); }
        50% { transform: scale(1.045); box-shadow: 0 0 44px rgba(124,58,237,.22); }
      }
      @keyframes pfh-home-glass-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }
      @keyframes pfh-home-orbit-spin {
        to { transform: rotate(360deg); }
      }
      @keyframes pfh-ripple {
        0% { transform: scale(.3); opacity: 0; }
        14% { opacity: .34; }
        100% { transform: scale(1.2); opacity: 0; }
      }
      /* pfh-upload-compact-fix: keep upload sidebar and drag area stable at narrow widths. */
      #${PANEL_ID} .pfh-main {
        grid-template-columns: minmax(126px, var(--pfh-list-width, 214px)) 6px minmax(0, 1fr) !important;
      }
      #${PANEL_ID} .pfh-list,
      #${PANEL_ID} .pfh-detail,
      #${PANEL_ID} .pfh-upload-section,
      #${PANEL_ID} .pfh-upload-body,
      #${PANEL_ID} .pfh-upload-list,
      #${PANEL_ID} .pfh-upload-drop,
      #${PANEL_ID} .pfh-upload-table-head,
      #${PANEL_ID} .pfh-upload-item {
        min-width: 0 !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      #${PANEL_ID} .pfh-upload-side {
        min-width: 0 !important;
        gap: 10px !important;
      }
      #${PANEL_ID} .pfh-upload-side-card,
      #${PANEL_ID} .pfh-upload-guide {
        min-width: 0 !important;
        max-width: 100% !important;
        padding: 11px 10px !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
      }
      #${PANEL_ID} .pfh-upload-side-card {
        grid-template-columns: 28px minmax(0, 1fr) !important;
        gap: 3px 8px !important;
        align-items: center !important;
      }
      #${PANEL_ID} .pfh-upload-side-card .pfh-icon {
        width: 28px !important;
        height: 28px !important;
        border-radius: 9px !important;
      }
      #${PANEL_ID} .pfh-upload-side-card .pfh-icon svg {
        width: 17px !important;
        height: 17px !important;
        color: currentColor !important;
        fill: currentColor !important;
        stroke: currentColor !important;
      }
      #${PANEL_ID} .pfh-upload-side-card .pfh-icon svg * {
        fill: currentColor !important;
        stroke: currentColor !important;
      }
      #${PANEL_ID} .pfh-upload-side-card strong,
      #${PANEL_ID} .pfh-upload-side-card span,
      #${PANEL_ID} .pfh-upload-guide b,
      #${PANEL_ID} .pfh-upload-guide p {
        min-width: 0 !important;
        max-width: 100% !important;
        overflow-wrap: anywhere !important;
        word-break: break-word !important;
      }
      #${PANEL_ID} .pfh-upload-side-card strong {
        font-size: 12px !important;
        line-height: 1.25 !important;
      }
      #${PANEL_ID} .pfh-upload-side-card span,
      #${PANEL_ID} .pfh-upload-guide p {
        font-size: 11px !important;
        line-height: 1.42 !important;
      }
      #${PANEL_ID} .pfh-upload-guide p {
        margin-top: 7px !important;
      }
      #${PANEL_ID} .pfh-upload-drop {
        width: 100% !important;
        flex: 0 0 auto !important;
        overflow: hidden !important;
        text-align: center !important;
        white-space: normal !important;
      }
      #${PANEL_ID} .pfh-upload-item > *,
      #${PANEL_ID} .pfh-upload-table-head > * {
        min-width: 0 !important;
      }
      #${PANEL_ID} .pfh-upload-item b,
      #${PANEL_ID} .pfh-upload-item small,
      #${PANEL_ID} .pfh-upload-item em,
      #${PANEL_ID} .pfh-upload-item span {
        min-width: 0 !important;
        max-width: 100% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      #${PANEL_ID} .pfh-log-panel {
        margin-top: 12px;
        padding: 12px;
        border: 1px solid rgba(211, 204, 255, .34);
        border-radius: 14px;
        background: rgba(255,255,255,.64);
      }
      #${PANEL_ID} .pfh-log-head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      #${PANEL_ID} .pfh-log-head strong {
        color: #17153f;
        font-size: 14px;
        font-weight: 800 !important;
      }
      #${PANEL_ID} .pfh-log-head span {
        margin-left: auto;
        color: #6b7897;
        font-size: 12px;
      }
      #${PANEL_ID} .pfh-log-list {
        display: grid;
        gap: 6px;
        max-height: 260px;
        overflow: auto;
      }
      #${PANEL_ID} .pfh-log-row {
        display: grid;
        grid-template-columns: 58px 52px minmax(0, 1fr);
        gap: 6px;
        align-items: start;
        padding: 7px 8px;
        border: 1px solid rgba(226, 232, 240, .88);
        border-radius: 10px;
        background: rgba(248,250,252,.82);
      }
      #${PANEL_ID} .pfh-log-row span,
      #${PANEL_ID} .pfh-log-row b {
        color: #6b7897;
        font-size: 11px;
        line-height: 1.35;
      }
      #${PANEL_ID} .pfh-log-row b {
        color: #475569;
      }
      #${PANEL_ID} .pfh-log-row p {
        min-width: 0;
        margin: 0;
        color: #1f2937;
        font-size: 12px;
        line-height: 1.4;
        overflow-wrap: anywhere;
      }
      #${PANEL_ID} .pfh-log-row.is-error {
        border-color: rgba(248, 113, 113, .32);
        background: rgba(254, 242, 242, .82);
      }
      #${PANEL_ID} .pfh-log-row.is-success {
        border-color: rgba(74, 222, 128, .30);
        background: rgba(240, 253, 244, .82);
      }
      #${PANEL_ID} .pfh-rule-panel {
        margin-top: 12px;
        padding-top: 10px;
        border-top: 1px solid rgba(211, 204, 255, .34);
      }
      #${PANEL_ID} .pfh-readiness-panel {
        margin-top: 10px;
        display: grid;
        gap: 7px;
        padding: 9px;
        border: 1px solid rgba(211, 204, 255, .34);
        border-radius: 12px;
        background: rgba(255,255,255,.58);
      }
      #${PANEL_ID} .pfh-readiness-row {
        display: grid;
        grid-template-columns: 54px minmax(82px, .8fr) minmax(0, 1.2fr);
        gap: 7px;
        align-items: center;
        padding: 6px 7px;
        border: 1px solid rgba(226, 232, 240, .84);
        border-radius: 10px;
        background: rgba(248,250,252,.74);
      }
      #${PANEL_ID} .pfh-readiness-row span {
        color: #64748b;
        font-size: 11px;
      }
      #${PANEL_ID} .pfh-readiness-row b {
        color: #1f2937;
        font-size: 12px;
        font-weight: 600;
      }
      #${PANEL_ID} .pfh-readiness-row small {
        min-width: 0;
        color: #64748b;
        font-size: 11px;
        overflow-wrap: anywhere;
      }
      #${PANEL_ID} .pfh-readiness-row.is-ok {
        border-color: rgba(74, 222, 128, .28);
        background: rgba(240, 253, 244, .68);
      }
      #${PANEL_ID} .pfh-readiness-row.is-ok span {
        color: #15803d;
      }
      #${PANEL_ID} .pfh-readiness-row.is-bad {
        border-color: rgba(248, 113, 113, .30);
        background: rgba(254, 242, 242, .72);
      }
      #${PANEL_ID} .pfh-readiness-row.is-bad span {
        color: #b42318;
      }
      #${PANEL_ID} .pfh-readiness-blockers {
        margin: 0;
        padding: 7px 8px;
        border-radius: 10px;
        color: #9f1239;
        background: rgba(255, 241, 242, .82);
        font-size: 12px;
        line-height: 1.45;
        overflow-wrap: anywhere;
      }
      #${PANEL_ID} .pfh-rule-maintenance-summary {
        display: grid;
        gap: 6px;
        margin-top: 2px;
        padding: 9px;
        border: 1px solid rgba(211,204,255,.40);
        border-radius: 12px;
        background: rgba(255,255,255,.62);
      }
      #${PANEL_ID} .pfh-rule-maintenance-summary > strong {
        color: #312e81;
        font-size: 12px;
        font-weight: 700;
      }
      #${PANEL_ID} .pfh-rule-maintenance-summary > span {
        color: #667085;
        font-size: 12px;
      }
      #${PANEL_ID} .pfh-rule-mini {
        display: grid;
        gap: 2px;
        padding: 6px 8px;
        border-radius: 10px;
        background: rgba(248,250,252,.82);
      }
      #${PANEL_ID} .pfh-rule-mini b {
        color: #1f2937;
        font-size: 12px;
        font-weight: 650;
      }
      #${PANEL_ID} .pfh-rule-mini small {
        color: #667085;
        font-size: 11px;
        line-height: 1.35;
      }
      #${PANEL_ID} .pfh-rule-list {
        display: grid;
        gap: 8px;
        max-height: 260px;
        overflow: auto;
      }
      #${PANEL_ID} .pfh-rule-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px 10px;
        padding: 10px;
        border: 1px solid rgba(211, 204, 255, .32);
        border-radius: 12px;
        background: rgba(255,255,255,.62);
      }
      #${PANEL_ID} .pfh-rule-row b,
      #${PANEL_ID} .pfh-rule-row small {
        display: block;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #${PANEL_ID} .pfh-rule-row b {
        color: #171a22;
        font-size: 12px;
        font-weight: 600;
      }
      #${PANEL_ID} .pfh-rule-row small {
        margin-top: 3px;
        color: #7a8498;
        font-size: 11px;
      }
      #${PANEL_ID} .pfh-rule-row p {
        grid-column: 1 / -1;
        margin: -2px 0 0;
        color: #8b93ad;
        font-size: 11px;
        line-height: 1.35;
      }
      #${PANEL_ID} .pfh-rule-row > span {
        align-self: start;
        padding: 2px 7px;
        border-radius: 999px;
        background: rgba(109, 53, 232, .10);
        color: #6d35e8;
        font-size: 11px;
      }
      #${PANEL_ID} .pfh-rule-actions {
        grid-column: 1 / -1;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      #${PANEL_ID} .pfh-rule-actions button {
        min-height: 24px;
        padding: 0 9px;
        border-radius: 999px;
        font-size: 11px;
      }
      #${PANEL_ID} .pfh-info-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 10px 12px !important;
        align-items: stretch !important;
      }
      #${PANEL_ID} .pfh-file-section .pfh-info-grid {
        margin-top: 10px !important;
      }
      #${PANEL_ID} .pfh-graphic-table.pfh-info-grid {
        padding: 0 !important;
        border: 0 !important;
        background: transparent !important;
      }
      #${PANEL_ID} .pfh-info-grid .pfh-row,
      #${PANEL_ID} .pfh-graphic-table.pfh-info-grid .pfh-row {
        position: relative !important;
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        grid-template-rows: auto 1fr !important;
        gap: 5px 8px !important;
        justify-items: start !important;
        text-align: left !important;
        min-height: 44px !important;
        padding: 8px 13px !important;
        border: 1px solid rgba(211, 204, 255, .34) !important;
        border-radius: 14px !important;
        background: rgba(255,255,255,.62) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.86) !important;
        cursor: pointer !important;
        transition: border-color .22s ease, background .22s ease, box-shadow .22s ease !important;
      }
      #${PANEL_ID} .pfh-info-grid .pfh-row:hover {
        border-color: rgba(119, 207, 151, .52) !important;
        background: rgba(255,255,255,.78) !important;
        box-shadow: 0 8px 18px rgba(78, 74, 142, .08), inset 0 1px 0 rgba(255,255,255,.92) !important;
      }
      #${PANEL_ID} .pfh-info-grid .pfh-row.is-copied {
        border-color: rgba(75, 222, 128, .72) !important;
        background: rgba(240, 253, 244, .86) !important;
        box-shadow: 0 0 0 3px rgba(75, 222, 128, .16), inset 0 1px 0 rgba(255,255,255,.94) !important;
      }
      #${PANEL_ID} .pfh-info-grid .pfh-label {
        grid-column: 1 / -1 !important;
        display: block !important;
        width: 100% !important;
        min-width: 0 !important;
        color: #8f98a8 !important;
        font-size: 11px !important;
        font-weight: 400 !important;
        line-height: 1.2 !important;
        text-align: left !important;
      }
      #${PANEL_ID} .pfh-info-grid .pfh-label .pfh-icon {
        display: none !important;
      }
      #${PANEL_ID} .pfh-info-grid .pfh-label span {
        display: block !important;
        width: 100% !important;
        text-align: left !important;
      }
      #${PANEL_ID} .pfh-info-grid .pfh-value,
      #${PANEL_ID} .pfh-info-grid .pfh-row.is-carton-dim .pfh-value,
      #${PANEL_ID} .pfh-info-grid .pfh-row.is-product-dim .pfh-value {
        grid-column: 1 / 2 !important;
        align-self: end !important;
        justify-self: start !important;
        min-width: 0 !important;
        color: #171a22 !important;
        font-size: 13px !important;
        font-weight: 400 !important;
        line-height: 1.18 !important;
        text-align: left !important;
        overflow-wrap: anywhere !important;
      }
      #${PANEL_ID} .pfh-info-grid .pfh-row.is-carton-dim .pfh-value,
      #${PANEL_ID} .pfh-info-grid .pfh-row.is-product-dim .pfh-value {
        color: #171a22 !important;
      }
      #${PANEL_ID} .pfh-info-grid .pfh-row-actions {
        grid-column: 2 / 3 !important;
        grid-row: 2 / 3 !important;
        align-self: end !important;
        justify-self: end !important;
        display: flex !important;
        min-width: 0 !important;
        gap: 0 !important;
      }
      #${PANEL_ID} .pfh-info-grid .pfh-row-actions:empty {
        display: none !important;
      }
      #${PANEL_ID} .pfh-info-grid .pfh-row-actions button {
        height: 26px !important;
        min-height: 26px !important;
        padding: 0 10px !important;
        border-radius: 999px !important;
        color: #6d35e8 !important;
        font-size: 12px !important;
        font-weight: 800 !important;
        background: rgba(255,255,255,.78) !important;
        border: 1px solid rgba(211,204,255,.50) !important;
      }
      #${PANEL_ID} .pfh-info-grid .pfh-inline-edit {
        width: 100% !important;
      }
      #${PANEL_ID} .pfh-info-grid .pfh-inline-edit input {
        max-width: 86px !important;
      }
      #${PANEL_ID} .pfh-info-grid [data-copy-key] {
        width: auto !important;
        height: auto !important;
        padding: 18px 20px !important;
      }
      #${PANEL_ID} .pfh-main:not(.is-full) .pfh-splitter {
        display: block !important;
        position: relative !important;
        z-index: 90 !important;
        width: 6px !important;
        min-width: 6px !important;
        align-self: stretch !important;
        cursor: col-resize !important;
        pointer-events: auto !important;
        touch-action: none !important;
      }
      #${PANEL_ID} .pfh-main:not(.is-full) .pfh-splitter::before {
        content: '' !important;
        position: absolute !important;
        top: 0 !important;
        bottom: 0 !important;
        left: -8px !important;
        right: -8px !important;
        cursor: col-resize !important;
        pointer-events: auto !important;
      }
      #${PANEL_ID} .pfh-main:not(.is-full) .pfh-list,
      #${PANEL_ID} .pfh-main:not(.is-full) .pfh-detail {
        position: relative !important;
        z-index: 1 !important;
      }
      #${PANEL_ID} {
        min-height: 560px !important;
      }
      #${PANEL_ID} > .pfh-full {
        min-height: 0 !important;
      }
      #${PANEL_ID} .pfh-main {
        flex: 1 1 auto !important;
        height: auto !important;
        min-height: 0 !important;
      }
      #${PANEL_ID} .pfh-graphic-section {
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
      }
      #${PANEL_ID} .pfh-graphic-title {
        flex-wrap: nowrap !important;
        align-items: center !important;
        width: 100% !important;
        gap: 8px 10px !important;
      }
      #${PANEL_ID} .pfh-graphic-title h3 {
        flex: 1 1 auto !important;
        min-width: 0 !important;
      }
      #${PANEL_ID} .pfh-excel-options-row {
        display: block !important;
        order: 2 !important;
        flex: 0 0 auto !important;
        width: 100% !important;
        clear: both !important;
      }
      #${PANEL_ID} .pfh-excel-options-row:empty {
        display: none !important;
      }
      #${PANEL_ID} .pfh-excel-options-row > .pfh-excel-form.is-open {
        display: flex !important;
        flex-wrap: wrap !important;
        width: 100% !important;
        max-width: none !important;
        margin: 8px 0 12px !important;
        box-sizing: border-box !important;
      }
      #${PANEL_ID} .pfh-excel-options-row .pfh-excel-status {
        max-width: none !important;
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }
      #${PANEL_ID} .pfh-section > .pfh-excel-form.is-open {
        flex: 0 0 100% !important;
        width: 100% !important;
        justify-content: flex-start !important;
        margin: 8px 0 12px !important;
      }
      #${PANEL_ID} .pfh-graphic-table {
        order: 3 !important;
      }
      #${PANEL_ID} .pfh-row[data-key="printSizeText"] .pfh-value {
        white-space: normal !important;
        line-height: 1.35 !important;
      }
      #${PANEL_ID} .pfh-smart-recommend {
        display: grid !important;
        gap: 4px !important;
        margin: 10px 0 12px !important;
        padding: 10px 12px !important;
        border: 1px solid rgba(167, 139, 250, .28) !important;
        border-radius: 14px !important;
        background: rgba(255,255,255,.72) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.88) !important;
      }
      #${PANEL_ID} .pfh-smart-recommend strong {
        color: #6d35e8 !important;
        font-size: 11px !important;
        font-weight: 500 !important;
        line-height: 1.2 !important;
      }
      #${PANEL_ID} .pfh-smart-recommend span {
        color: #171a22 !important;
        font-size: 13px !important;
        font-weight: 400 !important;
        line-height: 1.35 !important;
      }
      #${PANEL_ID} .pfh-smart-recommend span b {
        color: #171a22 !important;
        font-size: 13px !important;
        font-weight: 600 !important;
      }
      #${PANEL_ID} .pfh-smart-recommend small {
        color: #7d86a8 !important;
        font-size: 11px !important;
        font-weight: 400 !important;
        line-height: 1.35 !important;
      }
      #${PANEL_ID} .pfh-smart-recommend em {
        display: block !important;
        color: #8b93ad !important;
        font-size: 11px !important;
        font-style: normal !important;
        font-weight: 400 !important;
        line-height: 1.35 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      #${PANEL_ID} .pfh-smart-recommend.is-loading {
        opacity: .78 !important;
      }
      #${PANEL_ID} .pfh-graphic-section > .pfh-section-title.pfh-graphic-title {
        display: flex !important;
        flex: 0 0 auto !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
        justify-content: space-between !important;
        min-height: 34px !important;
        margin: 0 0 6px !important;
      }
      #${PANEL_ID} .pfh-graphic-section > .pfh-section-title.pfh-graphic-title h3 {
        flex: 1 1 auto !important;
        min-width: 0 !important;
        margin: 0 !important;
      }
      #${PANEL_ID} .pfh-graphic-section > .pfh-section-title.pfh-graphic-title .pfh-excel-controls {
        flex: 0 0 auto !important;
        margin-left: auto !important;
      }
      #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row {
        display: block !important;
        flex: 0 0 auto !important;
        width: 100% !important;
        min-width: 100% !important;
        margin: 0 !important;
        clear: both !important;
      }
      #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row:empty {
        display: none !important;
      }
      #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row > .pfh-excel-form.is-open {
        display: grid !important;
        grid-template-columns: minmax(96px, 1.15fr) minmax(54px, .62fr) 42px minmax(64px, .75fr) !important;
        align-items: center !important;
        gap: 6px 7px !important;
        width: 100% !important;
        max-width: none !important;
        margin: 6px 0 10px !important;
        padding: 8px 10px !important;
        box-sizing: border-box !important;
      }
      #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row > .pfh-excel-form.is-open .pfh-export-menu {
        position: relative !important;
        width: 100% !important;
        min-width: 0 !important;
        height: 28px !important;
        z-index: 8 !important;
      }
      #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row > .pfh-excel-form.is-open .pfh-export-menu-button {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        width: 100% !important;
        min-width: 0 !important;
        height: 28px !important;
        min-height: 28px !important;
        padding: 0 10px !important;
        color: #443075 !important;
        border: 1px solid rgba(167, 139, 250, .34) !important;
        border-radius: 12px !important;
        background: linear-gradient(180deg, rgba(255,255,255,.94), rgba(246,243,255,.86)) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.96), 0 6px 16px rgba(124, 58, 237, .08) !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        line-height: 1 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        cursor: pointer !important;
      }
      #${PANEL_ID} .pfh-export-menu-button span {
        min-width: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      #${PANEL_ID} .pfh-export-menu-button i {
        flex: 0 0 auto !important;
        width: 0 !important;
        height: 0 !important;
        margin-left: 6px !important;
        border-left: 4px solid transparent !important;
        border-right: 4px solid transparent !important;
        border-top: 5px solid #7c3aed !important;
        transition: transform .18s ease !important;
      }
      #${PANEL_ID} .pfh-export-menu.is-open .pfh-export-menu-button i {
        transform: rotate(180deg) !important;
      }
      #${PANEL_ID} .pfh-export-menu-list {
        position: absolute !important;
        left: 0 !important;
        right: 0 !important;
        top: calc(100% + 6px) !important;
        display: none !important;
        padding: 5px !important;
        border: 1px solid rgba(167, 139, 250, .30) !important;
        border-radius: 13px !important;
        background: rgba(255,255,255,.96) !important;
        box-shadow: 0 14px 30px rgba(64, 48, 112, .14), inset 0 1px 0 rgba(255,255,255,.95) !important;
        backdrop-filter: blur(14px) !important;
        overflow: hidden !important;
      }
      #${PANEL_ID} .pfh-export-menu.is-open .pfh-export-menu-list {
        display: grid !important;
        gap: 3px !important;
      }
      #${PANEL_ID} .pfh-export-menu-list button {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        width: 100% !important;
        height: 27px !important;
        min-height: 27px !important;
        padding: 0 10px !important;
        border: 0 !important;
        border-radius: 9px !important;
        background: transparent !important;
        box-shadow: none !important;
        color: #4b556f !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        text-align: left !important;
      }
      #${PANEL_ID} .pfh-export-menu-list button:hover,
      #${PANEL_ID} .pfh-export-menu-list button.is-active {
        color: #6d35e8 !important;
        background: linear-gradient(135deg, rgba(124, 58, 237, .12), rgba(167, 139, 250, .08)) !important;
      }
      #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row > .pfh-excel-form.is-open select,
      #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row > .pfh-excel-form.is-open input,
      #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row > .pfh-excel-form.is-open > button {
        width: 100% !important;
        min-width: 0 !important;
        height: 28px !important;
        min-height: 28px !important;
        box-sizing: border-box !important;
      }
      #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row > .pfh-excel-form.is-open select:focus {
        border-color: rgba(124, 58, 237, .58) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.96), 0 0 0 3px rgba(124, 58, 237, .10) !important;
      }
      #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row > .pfh-excel-form.is-open input,
      #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row > .pfh-excel-form.is-open > button {
        border: 1px solid rgba(190, 199, 220, .88) !important;
        border-radius: 10px !important;
        background: rgba(255,255,255,.82) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.92) !important;
      }
      #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row > .pfh-excel-form.is-open > button[data-action="excel-prepare"] {
        width: 100% !important;
        min-width: 0 !important;
        padding: 0 !important;
      }
      #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row > .pfh-excel-form.is-open > button[data-action="excel-prepare"] .pfh-icon,
      #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row > .pfh-excel-form.is-open > button[data-action="excel-prepare"] svg {
        width: 16px !important;
        height: 16px !important;
        margin: 0 auto !important;
        color: #566381 !important;
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
      }
      #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row > .pfh-excel-form.is-open > button[data-action="excel-generate"] {
        width: 100% !important;
        min-width: 0 !important;
        padding: 0 12px !important;
        border-radius: 10px !important;
      }
      #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row > .pfh-excel-form.is-open input {
        padding-left: 9px !important;
        padding-right: 9px !important;
      }
      #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row > .pfh-excel-form.is-open .pfh-excel-status {
        min-width: 0 !important;
        max-width: none !important;
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
        line-height: 1.3 !important;
        grid-column: 1 / -1 !important;
      }
      #${PANEL_ID} .pfh-graphic-section {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        align-items: stretch !important;
      }
      #${PANEL_ID} .pfh-graphic-section > .pfh-section-title.pfh-graphic-title {
        grid-row: 1 !important;
        grid-column: 1 / -1 !important;
      }
      #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row {
        grid-row: 2 !important;
        grid-column: 1 / -1 !important;
      }
      #${PANEL_ID} .pfh-graphic-section > .pfh-graphic-table {
        grid-row: 3 !important;
        grid-column: 1 / -1 !important;
      }
      #${PANEL_ID} .pfh-row[data-key="printSizeText"] .pfh-value {
        display: block !important;
        white-space: pre-line !important;
      }
      #${PANEL_ID} .pfh-settings-page {
        display: grid !important;
        gap: 10px !important;
        align-content: start !important;
        padding: 14px !important;
      }
      #${PANEL_ID} .pfh-settings-page > h3 {
        display: none !important;
      }
      #${PANEL_ID} .pfh-settings-hero {
        display: flex !important;
        align-items: flex-start !important;
        justify-content: space-between !important;
        gap: 12px !important;
        padding: 12px 14px !important;
        border: 1px solid rgba(211, 204, 255, .34) !important;
        border-radius: 14px !important;
        background: linear-gradient(135deg, rgba(255,255,255,.86), rgba(246,244,255,.70)) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.92) !important;
      }
      #${PANEL_ID} .pfh-settings-hero h3 {
        margin: 0 !important;
        color: #17153f !important;
        font-size: 16px !important;
        font-weight: 600 !important;
        line-height: 1.25 !important;
        cursor: default;
      }
      #${PANEL_ID} .pfh-settings-hero p {
        margin: 4px 0 0 !important;
        color: #6b7897 !important;
        font-size: 12px !important;
        line-height: 1.35 !important;
      }
      #${PANEL_ID} .pfh-settings-hero span {
        flex: 0 0 auto !important;
        color: #7c6ecf !important;
        font-size: 12px !important;
        line-height: 1.4 !important;
        white-space: nowrap !important;
      }
      #${PANEL_ID} .pfh-developer-backdrop {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: grid;
        place-items: center;
        padding: 20px;
        background: rgba(24, 20, 61, .22);
        backdrop-filter: blur(4px);
      }
      #${PANEL_ID} .pfh-first-run-backdrop {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        display: grid;
        place-items: center;
        padding: 18px;
        background: rgba(24, 20, 61, .28);
        backdrop-filter: blur(5px);
      }
      #${PANEL_ID} .pfh-first-run-dialog {
        width: min(500px, calc(100vw - 36px));
        max-height: min(760px, calc(100vh - 36px));
        overflow: auto;
        padding: 20px;
        border: 1px solid rgba(207, 196, 255, .78);
        border-radius: 16px;
        background: rgba(255, 255, 255, .97);
        box-shadow: 0 24px 60px rgba(47, 31, 111, .28);
      }
      #${PANEL_ID} .pfh-first-run-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }
      #${PANEL_ID} .pfh-first-run-head strong {
        color: #1c1b4b;
        font-size: 17px;
        font-weight: 600;
      }
      #${PANEL_ID} .pfh-first-run-head span {
        color: #806fd2;
        font-size: 12px;
        white-space: nowrap;
      }
      #${PANEL_ID} .pfh-first-run-dialog ol {
        display: grid;
        gap: 12px;
        margin: 0 0 18px;
        padding: 0;
        list-style: none;
      }
      #${PANEL_ID} .pfh-first-run-dialog li {
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr);
        gap: 10px;
        align-items: start;
      }
      #${PANEL_ID} .pfh-first-run-dialog li > b {
        display: grid;
        place-items: center;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: rgba(124, 58, 237, .12);
        color: #6d35e8;
        font-size: 11px;
        font-weight: 600;
      }
      #${PANEL_ID} .pfh-first-run-dialog p {
        margin: 1px 0;
        color: #566381;
        font-size: 13px;
        line-height: 1.55;
      }
      #${PANEL_ID} .pfh-first-run-dialog code {
        display: block;
        margin: 8px 0;
        padding: 9px 10px;
        overflow-wrap: anywhere;
        border: 1px solid rgba(197, 186, 255, .42);
        border-radius: 9px;
        background: rgba(246, 244, 255, .72);
        color: #4f3aa8;
        font-size: 11px;
        line-height: 1.5;
        white-space: normal;
      }
      #${PANEL_ID} .pfh-tutorial-key {
        display: grid;
        gap: 6px;
        margin-top: 10px;
      }
      #${PANEL_ID} .pfh-tutorial-key span {
        color: #4d3ba3;
        font-size: 12px;
        font-weight: 600;
      }
      #${PANEL_ID} .pfh-tutorial-key input {
        width: 100%;
        height: 34px;
        padding: 0 10px;
        border: 1px solid rgba(151, 126, 243, .48);
        border-radius: 9px;
        outline: 0;
        background: #fff;
        color: #29224f;
        font: inherit;
        box-sizing: border-box;
      }
      #${PANEL_ID} .pfh-tutorial-key input:focus {
        border-color: #7545ee;
        box-shadow: 0 0 0 3px rgba(117, 69, 238, .12);
      }
      #${PANEL_ID} .pfh-first-run-dialog > button {
        min-width: 104px;
        height: 34px;
        padding: 0 15px;
        border: 0;
        border-radius: 10px;
        background: #7545ee;
        color: #fff;
        font-size: 13px;
        box-shadow: 0 8px 16px rgba(117, 69, 238, .22);
      }
      #${PANEL_ID} .pfh-first-run-dialog > button:disabled {
        cursor: not-allowed;
        background: #c7c0df;
        box-shadow: none;
      }
      #${PANEL_ID} .pfh-developer-dialog {
        width: min(360px, calc(100vw - 40px));
        padding: 18px;
        border: 1px solid rgba(207, 196, 255, .76);
        border-radius: 16px;
        background: rgba(255, 255, 255, .96);
        box-shadow: 0 20px 50px rgba(53, 35, 119, .24);
      }
      #${PANEL_ID} .pfh-developer-dialog > div {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      #${PANEL_ID} .pfh-developer-dialog strong {
        color: #1c1b4b;
        font-size: 15px;
        font-weight: 600;
      }
      #${PANEL_ID} .pfh-developer-dialog span {
        color: #806fd2;
        font-size: 12px;
      }
      #${PANEL_ID} .pfh-developer-dialog p {
        margin: 10px 0 14px;
        color: #687492;
        font-size: 12px;
        line-height: 1.55;
      }
      #${PANEL_ID} .pfh-developer-dialog button {
        min-height: 32px;
        padding: 0 13px;
        border: 1px solid rgba(132, 106, 242, .32);
        border-radius: 10px;
        background: rgba(255, 255, 255, .86);
        color: #5d3ee8;
        font-size: 12px;
      }
      #${PANEL_ID} .pfh-developer-dialog button + button {
        margin-left: 8px;
      }
      #${PANEL_ID} .pfh-developer-dialog button:first-of-type {
        border-color: transparent;
        background: #7545ee;
        color: #fff;
        box-shadow: 0 8px 16px rgba(117, 69, 238, .22);
      }
      #${PANEL_ID} .pfh-settings-card,
      #${PANEL_ID} .pfh-settings-page > .pfh-log-panel {
        margin: 0 !important;
        padding: 12px !important;
        border: 1px solid rgba(211, 204, 255, .32) !important;
        border-radius: 14px !important;
        background: rgba(255,255,255,.68) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.86) !important;
      }
      #${PANEL_ID} .pfh-settings-card-head {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 10px !important;
        margin: 0 0 9px !important;
      }
      #${PANEL_ID} .pfh-settings-card-head strong,
      #${PANEL_ID} .pfh-settings-page .pfh-log-head strong {
        color: #17153f !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        line-height: 1.25 !important;
      }
      #${PANEL_ID} .pfh-settings-card-head span,
      #${PANEL_ID} .pfh-settings-page .pfh-log-head span {
        color: #7d86a8 !important;
        font-size: 11px !important;
        line-height: 1.3 !important;
        white-space: nowrap !important;
      }
      #${PANEL_ID} .pfh-settings-page .pfh-about-actions {
        display: flex !important;
        flex-wrap: wrap !important;
        align-items: center !important;
        gap: 7px !important;
        margin: 8px 0 0 !important;
      }
      #${PANEL_ID} .pfh-settings-page .pfh-about-actions button {
        height: 28px !important;
        min-height: 28px !important;
        padding: 0 10px !important;
        border: 1px solid rgba(190, 199, 220, .82) !important;
        border-radius: 10px !important;
        background: rgba(255,255,255,.76) !important;
        color: #253047 !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.90) !important;
      }
      #${PANEL_ID} .pfh-settings-page .pfh-about-actions button:hover {
        border-color: rgba(124, 58, 237, .28) !important;
        box-shadow: 0 8px 18px rgba(124,58,237,.10), inset 0 1px 0 rgba(255,255,255,.92) !important;
      }
      #${PANEL_ID} .pfh-settings-page .pfh-setting-row {
        display: grid !important;
        grid-template-columns: 86px minmax(0, max-content) minmax(0, max-content) !important;
        gap: 7px !important;
        align-items: center !important;
        margin-top: 7px !important;
        padding: 8px 9px !important;
        border: 1px solid rgba(226, 232, 240, .82) !important;
        border-radius: 12px !important;
        background: rgba(255,255,255,.58) !important;
      }
      #${PANEL_ID} .pfh-settings-page .pfh-setting-row > span {
        min-width: 0 !important;
        color: #6b7897 !important;
        font-size: 12px !important;
      }
      #${PANEL_ID} .pfh-settings-page .pfh-setting-row label {
        min-height: 26px !important;
        padding: 0 9px !important;
        border: 1px solid rgba(190, 199, 220, .78) !important;
        border-radius: 9px !important;
        background: rgba(255,255,255,.68) !important;
        color: #4b5875 !important;
        font-size: 12px !important;
      }
      #${PANEL_ID} .pfh-settings-page .pfh-setting-row label:has(input:checked) {
        border-color: rgba(124, 58, 237, .28) !important;
        background: rgba(244, 241, 255, .82) !important;
        color: #5f35c8 !important;
      }
      #${PANEL_ID} .pfh-settings-page .pfh-cloud-key {
        grid-template-columns: 72px minmax(0, 1fr) !important;
        gap: 8px !important;
        color: #6b7897 !important;
        font-size: 12px !important;
      }
      #${PANEL_ID} .pfh-settings-page .pfh-cloud-key input {
        height: 30px !important;
        border: 1px solid rgba(190, 199, 220, .86) !important;
        border-radius: 10px !important;
        background: rgba(255,255,255,.80) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.92) !important;
      }
      #${PANEL_ID} .pfh-settings-page .pfh-cloud-backup p,
      #${PANEL_ID} .pfh-settings-page .pfh-about-note,
      #${PANEL_ID} .pfh-settings-page .pfh-easter-egg,
      #${PANEL_ID} .pfh-settings-page .pfh-manual-note {
        display: none !important;
      }
      #${PANEL_ID} .pfh-settings-page .pfh-cloud-status,
      #${PANEL_ID} .pfh-settings-page .pfh-insight-status {
        color: #6d35e8 !important;
        font-size: 12px !important;
        line-height: 1.35 !important;
      }
      #${PANEL_ID} .pfh-settings-page .pfh-log-list {
        max-height: 220px !important;
      }
      #${PANEL_ID} .pfh-settings-page .pfh-log-row {
        grid-template-columns: 54px 48px minmax(0, 1fr) !important;
        padding: 6px 7px !important;
      }
      #${PANEL_ID} .pfh-settings-page .pfh-readiness-panel,
      #${PANEL_ID} .pfh-settings-page .pfh-rule-panel {
        margin-top: 10px !important;
      }
      #${PANEL_ID} .pfh-settings-page .pfh-rule-row,
      #${PANEL_ID} .pfh-settings-page .pfh-readiness-row {
        border-radius: 10px !important;
        background: rgba(248,250,252,.68) !important;
      }
      #${PANEL_ID} .pfh-list-head span {
        font-weight: 400 !important;
      }
      #${PANEL_ID} .pfh-header .pfh-actions {
        align-self: stretch !important;
        align-items: center !important;
        gap: 14px !important;
        padding-top: 4px !important;
        box-sizing: border-box !important;
      }
      #${PANEL_ID} .pfh-header .pfh-actions button,
      #${PANEL_ID} .pfh-list-head button[data-action="home-back"] {
        position: relative !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 36px !important;
        height: 36px !important;
        min-width: 36px !important;
        min-height: 36px !important;
        padding: 0 !important;
        border: 1px solid transparent !important;
        border-radius: 10px !important;
        background: transparent !important;
        color: #675f86 !important;
        box-shadow: none !important;
        transform: translateY(-1px) !important;
        overflow: visible !important;
      }
      #${PANEL_ID} .pfh-header .pfh-actions button:hover,
      #${PANEL_ID} .pfh-list-head button[data-action="home-back"]:hover {
        color: #6d35e8 !important;
        border-color: rgba(124, 58, 237, .16) !important;
        background: rgba(124, 58, 237, .10) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.82), 0 8px 18px rgba(124,58,237,.10) !important;
        transform: translateY(-1px) !important;
      }
      #${PANEL_ID} .pfh-header .pfh-actions button > span:not(.pfh-icon),
      #${PANEL_ID} .pfh-list-head button[data-action="home-back"] > span:not(.pfh-icon) {
        display: none !important;
      }
      #${PANEL_ID} .pfh-header .pfh-actions .pfh-icon,
      #${PANEL_ID} .pfh-list-head button[data-action="home-back"] .pfh-icon {
        width: 22px !important;
        height: 22px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: currentColor !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      #${PANEL_ID} .pfh-list-head button[data-action="home-back"] .pfh-icon-backArrow {
        width: 20px !important;
        height: 20px !important;
        line-height: 0 !important;
      }
      #${PANEL_ID} .pfh-header .pfh-actions .pfh-icon svg,
      #${PANEL_ID} .pfh-list-head button[data-action="home-back"] .pfh-icon svg {
        width: 20px !important;
        height: 20px !important;
        display: block !important;
        color: currentColor !important;
        fill: currentColor !important;
        stroke: currentColor !important;
        stroke-width: 1.8 !important;
      }
      #${PANEL_ID} .pfh-header .pfh-actions .pfh-icon-upload svg,
      #${PANEL_ID} .pfh-header .pfh-actions .pfh-icon-folder svg,
      #${PANEL_ID} .pfh-header .pfh-actions .pfh-icon-settings svg,
      #${PANEL_ID} .pfh-header .pfh-actions .pfh-icon-close svg,
      #${PANEL_ID} .pfh-list-head button[data-action="home-back"] .pfh-icon-backArrow svg {
        transform: none !important;
      }
      #${PANEL_ID} .pfh-header .pfh-actions button::after,
      #${PANEL_ID} .pfh-list-head button[data-action="home-back"]::after {
        content: attr(data-tooltip);
        position: absolute;
        left: 50%;
        top: calc(100% + 7px);
        z-index: 120;
        min-width: max-content;
        max-width: 130px;
        padding: 7px 10px;
        border-radius: 8px;
        color: #fff;
        background: #1f2937;
        box-shadow: 0 10px 24px rgba(31,41,55,.18);
        font-size: 12px;
        font-weight: 600;
        line-height: 1.2;
        opacity: 0;
        pointer-events: none;
        transform: translate(-50%, -4px);
        transition: opacity 140ms ease, transform 140ms ease;
        white-space: nowrap;
      }
      #${PANEL_ID} .pfh-header .pfh-actions button:hover::after,
      #${PANEL_ID} .pfh-list-head button[data-action="home-back"]:hover::after {
        opacity: 1;
        transform: translate(-50%, 0);
      }
      #${PANEL_ID} .pfh-list-head button[data-action="home-back"]::after {
        left: 0;
        transform: translate(0, -4px);
      }
      #${PANEL_ID} .pfh-list-head button[data-action="home-back"]:hover::after {
        transform: translate(0, 0);
      }
      #${PANEL_ID} .pfh-list-head button[data-action="home-back"]::after,
      #${PANEL_ID} .pfh-list-head button[data-action="home-back"]:hover::after {
        display: none !important;
        content: none !important;
      }
      #${PANEL_ID}.is-tooltip-suppressed .pfh-header .pfh-actions button::after,
      #${PANEL_ID}.is-collapsed .pfh-header .pfh-actions button::after {
        display: none !important;
      }
      #${PANEL_ID}.is-hover-resetting .pfh-header .pfh-actions button,
      #${PANEL_ID}.is-hover-resetting .pfh-header .pfh-actions button:hover {
        color: #675f86 !important;
        border-color: transparent !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      #${PANEL_ID} .pfh-search > button:hover {
        color: #fff !important;
        border-color: transparent !important;
        background: linear-gradient(135deg, #8b5cf6, #6d35e8) !important;
        box-shadow: 0 12px 26px rgba(124, 58, 237, 0.26) !important;
        filter: none !important;
      }
      #${PANEL_ID} .pfh-product-thumb.is-empty {
        background: rgba(255,255,255,.72) !important;
        border: 1px solid rgba(211, 204, 255, .34) !important;
        border-radius: 14px !important;
      }
      #${PANEL_ID} .pfh-product-thumb.is-empty .pfh-icon {
        width: 22px !important;
        height: 22px !important;
        color: #7c3aed !important;
      }
      #${PANEL_ID} .pfh-product-thumb.is-empty .pfh-icon svg {
        width: 22px !important;
        height: 22px !important;
        fill: currentColor !important;
      }
      #${PANEL_ID} .pfh-upload-section.is-open {
        display: grid !important;
        grid-template-rows: auto minmax(0, 1fr) auto !important;
        gap: 12px !important;
        height: 100% !important;
        padding: 14px !important;
        border: 1px solid rgba(211, 204, 255, .32) !important;
        border-radius: 16px !important;
        background: rgba(255,255,255,.68) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.86) !important;
      }
      #${PANEL_ID} .pfh-upload-title {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      #${PANEL_ID} .pfh-upload-title h3 {
        color: #17153f !important;
        font-size: 16px !important;
        font-weight: 600 !important;
        line-height: 1.25 !important;
      }
      #${PANEL_ID} .pfh-upload-status {
        margin-left: auto !important;
        padding: 5px 9px !important;
        border: 1px solid rgba(211, 204, 255, .32) !important;
        border-radius: 999px !important;
        background: rgba(244, 241, 255, .72) !important;
        color: #6d35e8 !important;
        font-size: 12px !important;
        line-height: 1.2 !important;
      }
      #${PANEL_ID} .pfh-upload-title > button[data-action="upload-toggle"] {
        height: 28px !important;
        min-height: 28px !important;
        padding: 0 10px !important;
        border: 1px solid rgba(190, 199, 220, .82) !important;
        border-radius: 10px !important;
        background: rgba(255,255,255,.76) !important;
        color: #253047 !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.90) !important;
      }
      #${PANEL_ID} .pfh-upload-body {
        display: grid !important;
        grid-template-rows: auto auto auto minmax(0, 1fr) !important;
        gap: 9px !important;
        min-height: 0 !important;
      }
      #${PANEL_ID} .pfh-upload-drop {
        min-height: 58px !important;
        display: grid !important;
        place-items: center !important;
        padding: 10px 12px !important;
        border: 1px dashed rgba(124, 58, 237, .30) !important;
        border-radius: 14px !important;
        background: rgba(248,250,252,.66) !important;
        color: #6b7897 !important;
        font-size: 12px !important;
      }
      #${PANEL_ID} .pfh-upload-actions {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 8px !important;
      }
      #${PANEL_ID} .pfh-upload-actions button,
      #${PANEL_ID} .pfh-upload-bottom-actions button {
        height: 28px !important;
        min-height: 28px !important;
        padding: 0 11px !important;
        border: 1px solid rgba(190, 199, 220, .82) !important;
        border-radius: 10px !important;
        background: rgba(255,255,255,.76) !important;
        color: #253047 !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.90) !important;
        line-height: 26px !important;
      }
      #${PANEL_ID} .pfh-upload-actions button:hover,
      #${PANEL_ID} .pfh-upload-bottom-actions button:hover {
        border-color: rgba(124, 58, 237, .28) !important;
        background: rgba(244, 241, 255, .82) !important;
        color: #5f35c8 !important;
      }
      #${PANEL_ID} .pfh-upload-table-head {
        min-height: 34px !important;
        padding: 0 10px !important;
        border: 1px solid rgba(226, 232, 240, .80) !important;
        border-radius: 12px !important;
        background: rgba(255,255,255,.58) !important;
        color: #7d86a8 !important;
        font-size: 11px !important;
      }
      #${PANEL_ID} .pfh-upload-list {
        gap: 7px !important;
        padding-right: 2px !important;
      }
      #${PANEL_ID} .pfh-upload-item {
        min-height: 54px !important;
        height: auto !important;
        flex: 0 0 auto !important;
        padding: 8px 10px !important;
        border: 1px solid rgba(226, 232, 240, .84) !important;
        border-radius: 12px !important;
        background: rgba(255,255,255,.70) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.86) !important;
      }
      #${PANEL_ID} .pfh-upload-item.is-current {
        border-color: rgba(124, 58, 237, .30) !important;
        background: rgba(244, 241, 255, .72) !important;
      }
      #${PANEL_ID} .pfh-upload-item b {
        color: #17153f !important;
        font-size: 12px !important;
        font-weight: 500 !important;
      }
      #${PANEL_ID} .pfh-upload-item small,
      #${PANEL_ID} .pfh-upload-item em,
      #${PANEL_ID} .pfh-upload-item span {
        color: #6b7897 !important;
        font-size: 11px !important;
      }
      #${PANEL_ID} .pfh-upload-item span.is-success,
      #${PANEL_ID} .pfh-upload-item span.is-ready {
        color: #15803d !important;
      }
      #${PANEL_ID} .pfh-upload-item span.is-missing {
        color: #b91c1c !important;
      }
      #${PANEL_ID} .pfh-upload-bottom {
        gap: 8px !important;
      }
      #${PANEL_ID} .pfh-upload-bottom-line {
        padding-top: 2px !important;
      }
      #${PANEL_ID} .pfh-upload-pager {
        color: #7d86a8 !important;
        font-size: 11px !important;
      }
      #${PANEL_ID} .pfh-upload-pager button,
      #${PANEL_ID} .pfh-upload-pager b,
      #${PANEL_ID} .pfh-upload-pager .pfh-pager-ellipsis {
        width: 24px !important;
        height: 24px !important;
        border-radius: 8px !important;
        border-color: rgba(190, 199, 220, .76) !important;
        background: rgba(255,255,255,.74) !important;
      }
      #${PANEL_ID} .pfh-upload-pager b {
        color: #6d35e8 !important;
        border-color: rgba(124, 58, 237, .28) !important;
        background: rgba(244, 241, 255, .76) !important;
      }
      #${PANEL_ID} .pfh-upload-section .pfh-note {
        margin: 0 !important;
        padding: 8px 0 0 !important;
        border-top: 1px solid rgba(211, 204, 255, .22) !important;
        color: #7d86a8 !important;
      }
      #${PANEL_ID} .pfh-title-open-detail {
        justify-self: start !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 5px !important;
        height: 26px !important;
        min-height: 26px !important;
        margin-top: 5px !important;
        padding: 0 10px !important;
        border: 1px solid rgba(124,58,237,.28) !important;
        border-radius: 10px !important;
        background: rgba(244,241,255,.78) !important;
        color: #6d35e8 !important;
        font-size: 12px !important;
        font-weight: 500 !important;
      }
      #${PANEL_ID} .pfh-title-open-detail .pfh-icon {
        width: 14px !important;
        height: 14px !important;
      }
      #${PANEL_ID} .pfh-ledger-page {
        display: grid !important;
        grid-template-rows: auto auto auto minmax(0, 1fr) auto !important;
        gap: 10px !important;
        height: 100% !important;
        min-width: 0 !important;
        padding: 14px !important;
        border: 1px solid rgba(211, 204, 255, .32) !important;
        border-radius: 16px !important;
        background: rgba(255,255,255,.68) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.86) !important;
      }
      #${PANEL_ID} .pfh-ledger-hero {
        display: flex !important;
        align-items: flex-start !important;
        justify-content: space-between !important;
        gap: 12px !important;
        min-width: 0 !important;
        padding: 12px 14px !important;
        border: 1px solid rgba(211, 204, 255, .34) !important;
        border-radius: 14px !important;
        background: linear-gradient(135deg, rgba(255,255,255,.88), rgba(246,244,255,.72)) !important;
      }
      #${PANEL_ID} .pfh-ledger-hero h3 {
        margin: 0 !important;
        color: #17153f !important;
        font-size: 16px !important;
        font-weight: 600 !important;
      }
      #${PANEL_ID} .pfh-ledger-hero p,
      #${PANEL_ID} .pfh-ledger-hero span {
        margin: 4px 0 0 !important;
        color: #6b7897 !important;
        font-size: 12px !important;
      }
      #${PANEL_ID} .pfh-ledger-toolbar {
        display: grid !important;
        grid-template-columns: minmax(118px, 1fr) repeat(4, auto) !important;
        gap: 8px !important;
        align-items: center !important;
        min-width: 0 !important;
      }
      #${PANEL_ID} .pfh-ledger-tabs {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
        padding: 4px !important;
        border: 1px solid rgba(211,204,255,.34) !important;
        border-radius: 14px !important;
        background: rgba(255,255,255,.62) !important;
      }
      #${PANEL_ID} .pfh-ledger-tabs button {
        height: 30px !important;
        min-height: 30px !important;
        border: 0 !important;
        border-radius: 10px !important;
        background: transparent !important;
        color: #6b7897 !important;
        font-size: 12px !important;
        font-weight: 500 !important;
      }
      #${PANEL_ID} .pfh-ledger-tabs button.is-active {
        background: linear-gradient(135deg, #7c3aed, #8b5cf6) !important;
        color: #fff !important;
        box-shadow: 0 8px 18px rgba(124,58,237,.18) !important;
      }
      #${PANEL_ID} .pfh-ledger-toolbar button,
      #${PANEL_ID} .pfh-ledger-toolbar input,
      #${PANEL_ID} .pfh-ledger-actions button {
        height: 28px !important;
        min-height: 28px !important;
        padding: 0 10px !important;
        border: 1px solid rgba(190, 199, 220, .82) !important;
        border-radius: 10px !important;
        background: rgba(255,255,255,.76) !important;
        color: #253047 !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.90) !important;
        font-size: 12px !important;
      }
      #${PANEL_ID} .pfh-ledger-toolbar button:hover,
      #${PANEL_ID} .pfh-ledger-actions button:hover {
        border-color: rgba(124, 58, 237, .28) !important;
        background: rgba(244, 241, 255, .82) !important;
        color: #5f35c8 !important;
      }
      #${PANEL_ID} .pfh-ledger-list {
        display: grid !important;
        gap: 10px !important;
        min-height: 0 !important;
        min-width: 0 !important;
        overflow: auto !important;
        padding-right: 2px !important;
      }
      #${PANEL_ID} .pfh-ledger-empty {
        display: grid !important;
        place-items: center !important;
        min-height: 120px !important;
        border: 1px dashed rgba(124, 58, 237, .28) !important;
        border-radius: 14px !important;
        color: #6b7897 !important;
        background: rgba(248,250,252,.64) !important;
        font-size: 12px !important;
      }
      #${PANEL_ID} .pfh-ledger-day {
        display: grid !important;
        gap: 7px !important;
      }
      #${PANEL_ID} .pfh-ledger-day h4 {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        margin: 0 !important;
        padding: 0 2px !important;
        color: #7d86a8 !important;
        font-size: 11px !important;
        font-weight: 500 !important;
      }
      #${PANEL_ID} .pfh-ledger-day h4 span {
        color: #9aa4bd !important;
        font-weight: 400 !important;
      }
      #${PANEL_ID} .pfh-ledger-item {
        display: grid !important;
        grid-template-columns: 42px minmax(160px, 1fr) 72px minmax(172px, auto) !important;
        grid-template-areas:
          "thumb main status actions"
          "thumb tags tags actions" !important;
        gap: 8px !important;
        align-items: center !important;
        min-height: 62px !important;
        padding: 7px 10px !important;
        border: 1px solid rgba(226, 232, 240, .84) !important;
        border-radius: 12px !important;
        background: rgba(255,255,255,.70) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.86) !important;
      }
      #${PANEL_ID} .pfh-ledger-item.is-finalized {
        grid-template-columns: 42px minmax(160px, 1fr) 72px !important;
        grid-template-areas:
          "thumb main status"
          "thumb tags tags" !important;
      }
      #${PANEL_ID} .pfh-ledger-thumb {
        grid-area: thumb !important;
        width: 38px !important;
        height: 38px !important;
        padding: 0 !important;
        overflow: hidden !important;
        border: 1px solid rgba(211,204,255,.36) !important;
        border-radius: 10px !important;
        background: #fff !important;
      }
      #${PANEL_ID} .pfh-ledger-thumb img {
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
      }
      #${PANEL_ID} .pfh-ledger-thumb .pfh-icon {
        width: 20px !important;
        height: 20px !important;
        color: #7c3aed !important;
      }
      #${PANEL_ID} .pfh-ledger-main {
        grid-area: main !important;
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        gap: 6px !important;
        align-items: start !important;
        min-width: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        background: transparent !important;
        text-align: left !important;
      }
      #${PANEL_ID} .pfh-ledger-title {
        display: grid !important;
        gap: 2px !important;
        min-width: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        background: transparent !important;
        color: inherit !important;
        text-align: left !important;
      }
      #${PANEL_ID} .pfh-ledger-main b {
        color: #17153f !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      #${PANEL_ID} .pfh-ledger-link {
        display: inline-grid !important;
        place-items: center !important;
        flex: 0 0 auto !important;
        width: 22px !important;
        height: 22px !important;
        min-height: 22px !important;
        padding: 0 !important;
        border: 1px solid rgba(124,58,237,.26) !important;
        border-radius: 8px !important;
        background: rgba(244,241,255,.72) !important;
        color: #6d35e8 !important;
      }
      #${PANEL_ID} .pfh-ledger-link .pfh-icon {
        width: 13px !important;
        height: 13px !important;
      }
      #${PANEL_ID} .pfh-ledger-main small,
      #${PANEL_ID} .pfh-ledger-main em {
        color: #6b7897 !important;
        font-size: 11px !important;
        font-style: normal !important;
      }
      #${PANEL_ID} .pfh-ledger-status {
        grid-area: status !important;
        justify-self: start !important;
        padding: 4px 8px !important;
        border-radius: 999px !important;
        background: rgba(244,241,255,.82) !important;
        color: #6d35e8 !important;
        font-size: 11px !important;
      }
      #${PANEL_ID} .pfh-ledger-status.is-done {
        background: rgba(220,252,231,.78) !important;
        color: #15803d !important;
      }
      #${PANEL_ID} .pfh-ledger-status.is-error {
        background: rgba(254,226,226,.78) !important;
        color: #b91c1c !important;
      }
      #${PANEL_ID} .pfh-ledger-status.is-void {
        background: rgba(226,232,240,.72) !important;
        color: #64748b !important;
      }
      #${PANEL_ID} .pfh-ledger-actions {
        grid-area: actions !important;
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 6px !important;
        min-width: 0 !important;
      }
      #${PANEL_ID} .pfh-ledger-tags {
        grid-area: tags !important;
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 5px !important;
        min-width: 0 !important;
      }
      #${PANEL_ID} .pfh-ledger-tags span,
      #${PANEL_ID} .pfh-ledger-tags button {
        max-width: 120px !important;
        height: 22px !important;
        min-height: 22px !important;
        padding: 0 7px !important;
        overflow: hidden !important;
        border: 1px solid rgba(211,204,255,.42) !important;
        border-radius: 999px !important;
        background: rgba(255,255,255,.70) !important;
        color: #6b7897 !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.86) !important;
        font-size: 10px !important;
        line-height: 20px !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      #${PANEL_ID} .pfh-ledger-tags button.is-done {
        border-color: rgba(124,58,237,.30) !important;
        background: rgba(244,241,255,.90) !important;
        color: #6d35e8 !important;
      }
      #${PANEL_ID} .pfh-ledger-actions button:disabled {
        opacity: .45 !important;
        cursor: not-allowed !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-page {
        padding: 12px !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-hero {
        align-items: flex-start !important;
        padding: 11px 12px !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-hero h3 {
        font-size: 15px !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-hero p {
        max-width: 460px !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-toolbar {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 6px !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-toolbar button,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-toolbar input {
        width: 100% !important;
        min-width: 0 !important;
        padding: 0 8px !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-date {
        grid-column: span 3 !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-head {
        display: none !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-item {
        grid-template-columns: 42px minmax(0, 1fr) auto !important;
        grid-template-areas:
          "thumb main status"
          "thumb tags tags"
          "thumb actions actions" !important;
        gap: 5px 8px !important;
        min-height: 0 !important;
        padding: 7px 10px !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-item.is-finalized {
        grid-template-areas:
          "thumb main status"
          "thumb tags tags" !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-thumb {
        grid-area: thumb !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-main {
        grid-area: main !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-status {
        grid-area: status !important;
        justify-self: end !important;
        white-space: nowrap !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-actions {
        grid-area: actions !important;
        justify-content: flex-start !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-tags {
        grid-area: tags !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-actions button {
        flex: 0 1 auto !important;
        min-width: 54px !important;
        padding: 0 8px !important;
      }
      @media (max-width: 760px) {
        #${PANEL_ID} .pfh-info-grid {
          grid-template-columns: 1fr !important;
        }
        #${PANEL_ID} .pfh-settings-page .pfh-setting-row {
          grid-template-columns: 1fr !important;
        }
        #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row > .pfh-excel-form.is-open {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row > .pfh-excel-form.is-open .pfh-excel-status {
          grid-column: 1 / -1 !important;
        }
        #${PANEL_ID} .pfh-ledger-head {
          display: none !important;
        }
        #${PANEL_ID} .pfh-ledger-item {
          grid-template-columns: 42px minmax(0, 1fr) !important;
        }
        #${PANEL_ID} .pfh-ledger-status,
        #${PANEL_ID} .pfh-ledger-actions {
          grid-column: 2 / -1 !important;
        }
      }
      @media (max-width: 430px) {
        #${PANEL_ID} .pfh-graphic-section > .pfh-excel-options-row > .pfh-excel-form.is-open {
          grid-template-columns: 1fr !important;
        }
      }
      #${PANEL_ID} .pfh-title-meta {
        grid-template-columns: 92px minmax(0, 1fr) !important;
        min-height: 122px !important;
      }
      #${PANEL_ID} .pfh-product-thumb,
      #${PANEL_ID} .pfh-thumb-frame,
      #${PANEL_ID} .pfh-thumb-preview {
        width: 76px !important;
        height: 76px !important;
      }
      #${PANEL_ID} .pfh-product-thumb:hover .pfh-thumb-preview {
        width: 284px !important;
        height: 284px !important;
      }
      #${PANEL_ID} .pfh-title-open-detail {
        height: 28px !important;
        min-height: 28px !important;
        padding: 0 14px !important;
        border: 1px solid rgba(124,58,237,.30) !important;
        border-radius: 999px !important;
        background: rgba(244,241,255,.82) !important;
        color: #6d35e8 !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        line-height: 28px !important;
      }
      #${PANEL_ID} .pfh-title-open-detail .pfh-icon {
        display: none !important;
      }
      #${PANEL_ID} .pfh-list-head button[data-action="home-back"] {
        display: grid !important;
        place-items: center !important;
        line-height: 0 !important;
        transform: none !important;
      }
      #${PANEL_ID} .pfh-list-head button[data-action="home-back"] .pfh-icon,
      #${PANEL_ID} .pfh-list-head button[data-action="home-back"] .pfh-icon-backArrow {
        display: grid !important;
        place-items: center !important;
        width: 18px !important;
        height: 18px !important;
        margin: 0 !important;
      }
      #${PANEL_ID} .pfh-list-head button[data-action="home-back"] .pfh-icon svg {
        width: 18px !important;
        height: 18px !important;
      }
      #${PANEL_ID} .pfh-ledger-item,
      #${PANEL_ID} .pfh-ledger-item.is-finalized,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-item,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-item.is-finalized {
        display: grid !important;
        grid-template-columns: 112px minmax(0, 1fr) !important;
        grid-template-areas: "thumb main" !important;
        gap: 18px !important;
        align-items: stretch !important;
        min-height: 156px !important;
        padding: 16px !important;
        border-radius: 18px !important;
        background: rgba(255,255,255,.80) !important;
        border-color: rgba(226,232,240,.92) !important;
        box-shadow: 0 14px 34px rgba(31,41,55,.055), inset 0 1px 0 rgba(255,255,255,.90) !important;
      }
      #${PANEL_ID} .pfh-ledger-thumb,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-thumb {
        grid-area: thumb !important;
        align-self: start !important;
        width: 112px !important;
        height: 112px !important;
        border-radius: 17px !important;
        background: #fff !important;
        border-color: rgba(211,204,255,.42) !important;
      }
      #${PANEL_ID} .pfh-ledger-main,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-main {
        grid-area: main !important;
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        grid-template-rows: auto auto minmax(0, 1fr) !important;
        gap: 10px !important;
        align-content: start !important;
        min-width: 0 !important;
      }
      #${PANEL_ID} .pfh-ledger-title-row {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto auto !important;
        align-items: start !important;
        gap: 8px !important;
        min-width: 0 !important;
      }
      #${PANEL_ID} .pfh-ledger-title {
        display: grid !important;
        justify-items: start !important;
        gap: 7px !important;
        min-width: 0 !important;
      }
      #${PANEL_ID} .pfh-ledger-main b {
        color: #17153f !important;
        font-size: 16px !important;
        line-height: 1.25 !important;
        font-weight: 650 !important;
        white-space: normal !important;
        overflow: hidden !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 2 !important;
        -webkit-box-orient: vertical !important;
      }
      #${PANEL_ID} .pfh-ledger-main small {
        display: inline-flex !important;
        width: max-content !important;
        max-width: 100% !important;
        height: 22px !important;
        align-items: center !important;
        padding: 0 9px !important;
        border: 1px solid rgba(124,58,237,.38) !important;
        border-radius: 999px !important;
        color: #6d35e8 !important;
        background: rgba(255,255,255,.70) !important;
        font-size: 12px !important;
        font-style: normal !important;
        line-height: 20px !important;
      }
      #${PANEL_ID} .pfh-ledger-link {
        width: 38px !important;
        height: 38px !important;
        min-height: 38px !important;
        border-radius: 15px !important;
        border: 0 !important;
        background: rgba(244,241,255,.92) !important;
        color: #6d35e8 !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.86) !important;
      }
      #${PANEL_ID} .pfh-ledger-link .pfh-icon,
      #${PANEL_ID} .pfh-ledger-link .pfh-icon svg {
        width: 19px !important;
        height: 19px !important;
      }
      #${PANEL_ID} .pfh-ledger-status,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-status {
        grid-area: auto !important;
        justify-self: end !important;
        align-self: start !important;
        padding: 7px 12px !important;
        border-radius: 14px !important;
        background: rgba(244,241,255,.92) !important;
        color: #6d35e8 !important;
        font-size: 13px !important;
        font-weight: 650 !important;
        white-space: nowrap !important;
      }
      #${PANEL_ID} .pfh-ledger-tags,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-tags {
        grid-area: auto !important;
        display: flex !important;
        flex-wrap: wrap !important;
        align-items: flex-start !important;
        gap: 8px !important;
        min-height: 0 !important;
      }
      #${PANEL_ID} .pfh-ledger-tags span {
        width: auto !important;
        max-width: 170px !important;
        height: 28px !important;
        min-height: 28px !important;
        padding: 0 10px !important;
        border-radius: 9px !important;
        border-color: rgba(211,204,255,.54) !important;
        background: rgba(255,255,255,.76) !important;
        color: #64748b !important;
        font-size: 12px !important;
        line-height: 26px !important;
      }
      #${PANEL_ID} .pfh-ledger-tags .is-design-type {
        color: #c45a16 !important;
        border-color: rgba(251,146,60,.30) !important;
        background: rgba(255,247,237,.84) !important;
      }
      #${PANEL_ID} .pfh-ledger-tags .is-pack {
        color: #2563eb !important;
        border-color: rgba(96,165,250,.34) !important;
        background: rgba(239,246,255,.88) !important;
      }
      #${PANEL_ID} .pfh-ledger-actions,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-actions {
        grid-area: auto !important;
        display: flex !important;
        flex-wrap: wrap !important;
        align-self: end !important;
        gap: 10px !important;
        margin-top: 8px !important;
      }
      #${PANEL_ID} .pfh-ledger-actions button,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-actions button {
        height: 36px !important;
        min-height: 36px !important;
        min-width: 64px !important;
        padding: 0 16px !important;
        border-radius: 13px !important;
        font-size: 13px !important;
        font-weight: 650 !important;
      }
      #${PANEL_ID} .pfh-ledger-actions button.is-active {
        border-color: transparent !important;
        background: linear-gradient(135deg, #7c3aed, #8b5cf6) !important;
        color: #fff !important;
        box-shadow: 0 10px 22px rgba(124,58,237,.20) !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(76px, 118px)) !important;
        gap: 10px !important;
        align-self: end !important;
        margin-top: 18px !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions button {
        position: relative !important;
        height: 44px !important;
        min-height: 44px !important;
        padding: 0 16px !important;
        border: 1px solid rgba(124,58,237,.58) !important;
        border-radius: 14px !important;
        background: rgba(255,255,255,.82) !important;
        color: #6d35e8 !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.90) !important;
        font-size: 15px !important;
        font-weight: 650 !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions button small {
        display: none !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions button.is-done {
        border-color: transparent !important;
        background: linear-gradient(135deg, #7c3aed, #8b5cf6) !important;
        color: #fff !important;
        box-shadow: 0 10px 22px rgba(124,58,237,.20) !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions button.is-skip {
        background: rgba(255,255,255,.86) !important;
        color: #6d35e8 !important;
        text-decoration: line-through !important;
        text-decoration-thickness: 1px !important;
        text-underline-offset: -4px !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions button.is-pending {
        border-color: rgba(95,111,143,.70) !important;
        color: #6d35e8 !important;
        background: rgba(255,255,255,.76) !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-item,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-item.is-finalized {
        grid-template-columns: 96px minmax(0, 1fr) !important;
        gap: 14px !important;
        padding: 14px !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-thumb {
        width: 96px !important;
        height: 96px !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-file-actions {
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      }
      #${PANEL_ID} .pfh-ledger-item,
      #${PANEL_ID} .pfh-ledger-item.is-finalized,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-item,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-item.is-finalized {
        grid-template-columns: 84px minmax(0, 1fr) !important;
        gap: 14px !important;
        min-height: 118px !important;
        padding: 12px 14px !important;
        border-radius: 15px !important;
      }
      #${PANEL_ID} .pfh-ledger-thumb,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-thumb {
        width: 84px !important;
        height: 84px !important;
        border-radius: 15px !important;
      }
      #${PANEL_ID} .pfh-ledger-thumb-empty {
        display: grid !important;
        place-items: center !important;
        width: 100% !important;
        height: 100% !important;
        color: #8b5cf6 !important;
        background: #fff !important;
      }
      #${PANEL_ID} .pfh-ledger-thumb-empty .pfh-icon {
        width: 30px !important;
        height: 30px !important;
        color: currentColor !important;
        opacity: .72 !important;
      }
      #${PANEL_ID} .pfh-ledger-thumb-empty svg,
      #${PANEL_ID} .pfh-ledger-thumb-empty svg path {
        fill: currentColor !important;
        stroke: none !important;
      }
      #${PANEL_ID} .pfh-ledger-main,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-main {
        grid-template-rows: auto auto auto !important;
        gap: 7px !important;
      }
      #${PANEL_ID} .pfh-ledger-title-row {
        grid-template-columns: minmax(0, 1fr) 32px auto !important;
        gap: 7px !important;
      }
      #${PANEL_ID} .pfh-ledger-main b {
        font-size: 14px !important;
        line-height: 1.22 !important;
        -webkit-line-clamp: 2 !important;
      }
      #${PANEL_ID} .pfh-ledger-main small {
        height: 20px !important;
        padding: 0 8px !important;
        font-size: 11px !important;
        line-height: 18px !important;
      }
      #${PANEL_ID} .pfh-ledger-link {
        width: 32px !important;
        height: 32px !important;
        min-height: 32px !important;
        border-radius: 12px !important;
        color: #6d35e8 !important;
      }
      #${PANEL_ID} .pfh-ledger-link .pfh-icon,
      #${PANEL_ID} .pfh-ledger-link .pfh-icon svg {
        width: 17px !important;
        height: 17px !important;
        color: currentColor !important;
      }
      #${PANEL_ID} .pfh-ledger-link svg path {
        fill: currentColor !important;
        stroke: none !important;
      }
      #${PANEL_ID} .pfh-ledger-status,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-status {
        padding: 6px 10px !important;
        border-radius: 12px !important;
        font-size: 12px !important;
      }
      #${PANEL_ID} .pfh-ledger-tags {
        gap: 7px !important;
      }
      #${PANEL_ID} .pfh-ledger-tags span {
        height: 24px !important;
        min-height: 24px !important;
        padding: 0 9px !important;
        border-radius: 8px !important;
        font-size: 11px !important;
        line-height: 22px !important;
      }
      #${PANEL_ID} .pfh-ledger-tags .is-priority {
        color: #6d35e8 !important;
        border-color: rgba(167,139,250,.30) !important;
        background: rgba(244,241,255,.82) !important;
      }
      #${PANEL_ID} .pfh-ledger-tags .is-priority.is-p0 {
        color: #b42318 !important;
        border-color: rgba(248,113,113,.30) !important;
        background: rgba(254,202,202,.78) !important;
      }
      #${PANEL_ID} .pfh-ledger-tags .is-priority.is-p1 {
        color: #92400e !important;
        border-color: rgba(251,191,36,.34) !important;
        background: rgba(254,240,138,.72) !important;
      }
      #${PANEL_ID} .pfh-ledger-actions,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-actions {
        gap: 8px !important;
        margin-top: 5px !important;
      }
      #${PANEL_ID} .pfh-ledger-actions button,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-actions button {
        height: 30px !important;
        min-height: 30px !important;
        min-width: 54px !important;
        padding: 0 11px !important;
        border-radius: 10px !important;
        font-size: 12px !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions {
        grid-template-columns: repeat(3, minmax(70px, 1fr)) !important;
        gap: 8px !important;
        margin-top: 8px !important;
        max-width: 360px !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions button {
        height: 32px !important;
        min-height: 32px !important;
        padding: 0 12px !important;
        border-radius: 11px !important;
        font-size: 13px !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-item,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-item.is-finalized {
        grid-template-columns: 74px minmax(0, 1fr) !important;
        gap: 12px !important;
        padding: 11px 12px !important;
      }
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-thumb {
        width: 74px !important;
        height: 74px !important;
      }
      #${PANEL_ID} .pfh-ledger-list {
        align-content: start !important;
        grid-auto-rows: max-content !important;
      }
      #${PANEL_ID} .pfh-ledger-day {
        align-content: start !important;
        grid-auto-rows: max-content !important;
      }
      #${PANEL_ID} .pfh-ledger-item,
      #${PANEL_ID} .pfh-ledger-item.is-finalized,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-item,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-item.is-finalized {
        align-self: start !important;
        align-items: center !important;
        min-height: 112px !important;
        height: auto !important;
      }
      #${PANEL_ID} .pfh-ledger-thumb,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-thumb {
        align-self: center !important;
      }
      #${PANEL_ID} .pfh-ledger-main b {
        font-weight: 600 !important;
      }
      #${PANEL_ID} .pfh-ledger-main small,
      #${PANEL_ID} .pfh-ledger-status,
      #${PANEL_ID} .pfh-ledger-tags span,
      #${PANEL_ID} .pfh-ledger-actions button,
      #${PANEL_ID} .pfh-ledger-file-actions button,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-actions button {
        font-weight: 400 !important;
      }
      #${PANEL_ID} .pfh-ledger-tags .is-date {
        padding: 0 !important;
        border-color: transparent !important;
        background: transparent !important;
        box-shadow: none !important;
        color: #6b7897 !important;
      }
      #${PANEL_ID} .pfh-ledger-link {
        border: 0 !important;
        background: rgba(244,241,255,.76) !important;
        box-shadow: none !important;
      }
      #${PANEL_ID} .pfh-ledger-link .pfh-icon {
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      #${PANEL_ID} .pfh-ledger-link.is-disabled {
        color: #b9b2d7 !important;
        background: rgba(244,241,255,.50) !important;
        cursor: not-allowed !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-main {
        grid-template-columns: minmax(0, 1fr) !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-list,
      #${PANEL_ID}[data-view="upload"] .pfh-splitter {
        display: none !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-detail {
        min-width: 0 !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-scroll {
        padding: 14px !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-section.is-open {
        gap: 14px !important;
        min-height: 100% !important;
        padding: 18px !important;
        border-radius: 18px !important;
        background: rgba(255,255,255,.76) !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-title {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        padding-bottom: 6px !important;
        border-bottom: 1px solid rgba(226,232,240,.68) !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-title h3 {
        font-size: 18px !important;
        margin-right: 4px !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-status {
        margin-left: 0 !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-title > button {
        height: 30px !important;
        min-height: 30px !important;
        padding: 0 12px !important;
        border-radius: 10px !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-title > button:first-of-type {
        margin-left: auto !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-body {
        display: grid !important;
        grid-template-rows: auto auto auto minmax(150px, 1fr) !important;
        gap: 12px !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-section.is-history-view .pfh-upload-body {
        grid-template-rows: auto minmax(260px, 1fr) !important;
        min-height: 360px !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-drop {
        position: relative !important;
        isolation: isolate !important;
        overflow: hidden !important;
        min-height: 116px !important;
        border-width: 2px !important;
        border-color: rgba(168,85,247,.45) !important;
        background:
          radial-gradient(circle at 50% -10%, rgba(168,85,247,.18), transparent 46%),
          linear-gradient(180deg, rgba(255,255,255,.72), rgba(250,245,255,.60)) !important;
        font-size: 13px !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.92), 0 12px 34px rgba(124,58,237,.08) !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-drop::before {
        content: "" !important;
        position: absolute !important;
        inset: 10px !important;
        border-radius: 12px !important;
        border: 1px solid rgba(168,85,247,.24) !important;
        pointer-events: none !important;
        animation: pfh-upload-drop-glow 2.8s ease-in-out infinite !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-drop::after {
        content: "" !important;
        position: absolute !important;
        inset: 0 !important;
        background: linear-gradient(115deg, transparent 0 34%, rgba(255,255,255,.28) 48%, transparent 64% 100%) !important;
        transform: translateX(-120%) !important;
        pointer-events: none !important;
        animation: pfh-upload-drop-sweep 3.6s ease-in-out infinite !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-actions button[data-action="upload-start"] {
        border-color: transparent !important;
        background: linear-gradient(135deg, #7c3aed, #8b5cf6) !important;
        color: #fff !important;
        box-shadow: 0 10px 20px rgba(124,58,237,.20) !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-list {
        min-height: 142px !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-section.is-history-view .pfh-upload-list {
        min-height: 260px !important;
        height: auto !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-info-grid {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 14px !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-guide {
        min-width: 0 !important;
        padding: 16px !important;
        border: 1px solid rgba(226,232,240,.78) !important;
        border-radius: 16px !important;
        background: rgba(255,255,255,.72) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.9) !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-guide b {
        color: #17153f !important;
        font-size: 14px !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-guide p {
        margin: 8px 0 0 !important;
        color: #64748b !important;
        font-size: 12px !important;
        line-height: 1.55 !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-history-card {
        display: none !important;
      }
      #${PANEL_ID} .pfh-ledger-toolbar {
        grid-template-columns: 136px 54px 58px 66px 54px !important;
        gap: 6px !important;
        justify-content: start !important;
      }
      #${PANEL_ID} .pfh-ledger-toolbar input,
      #${PANEL_ID} .pfh-ledger-toolbar button {
        min-width: 0 !important;
        padding: 0 8px !important;
        white-space: nowrap !important;
      }
      #${PANEL_ID} .pfh-ledger-edit-time {
        height: 22px !important;
        min-height: 22px !important;
        padding: 0 7px !important;
        border: 0 !important;
        border-radius: 7px !important;
        background: rgba(244,241,255,.72) !important;
        color: #6d35e8 !important;
        font-size: 10px !important;
        font-weight: 400 !important;
        line-height: 22px !important;
      }
      #${PANEL_ID} .pfh-ledger-edit-time:hover {
        background: rgba(232,225,255,.92) !important;
        color: #5424c7 !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions button.is-skip {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 5px !important;
        border: 1px dashed rgba(100,116,139,.72) !important;
        background: repeating-linear-gradient(-45deg, rgba(241,245,249,.96) 0 6px, rgba(226,232,240,.64) 6px 12px) !important;
        color: #475569 !important;
        text-decoration: none !important;
        box-shadow: none !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions button.is-skip::before {
        content: '\\2715' !important;
        display: inline-grid !important;
        place-items: center !important;
        width: 14px !important;
        height: 14px !important;
        border: 1px solid rgba(100,116,139,.72) !important;
        border-radius: 50% !important;
        color: #64748b !important;
        font-size: 9px !important;
        line-height: 1 !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions button.is-skip em {
        display: inline !important;
        color: #64748b !important;
        font-size: 10px !important;
        font-style: normal !important;
        line-height: 1 !important;
      }
      #${PANEL_ID} .pfh-list-head {
        display: grid !important;
        grid-template-columns: 36px minmax(0, 1fr) auto !important;
        align-items: center !important;
        column-gap: 10px !important;
        min-height: 36px !important;
      }
      #${PANEL_ID} .pfh-list-head strong,
      #${PANEL_ID} .pfh-list-head span {
        align-self: center !important;
        margin: 0 !important;
      }
      #${PANEL_ID} .pfh-list-head span {
        justify-self: end !important;
        white-space: nowrap !important;
      }
      #${PANEL_ID} .pfh-search-result-toolbar {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
        margin: 0 0 8px !important;
        min-height: 28px !important;
      }
      #${PANEL_ID} .pfh-search-result-toolbar button {
        height: 26px !important;
        padding: 0 9px !important;
        border: 1px solid rgba(124, 58, 237, .24) !important;
        border-radius: 9px !important;
        background: rgba(244, 241, 255, .78) !important;
        color: #6d35e8 !important;
        font-size: 11px !important;
        font-weight: 500 !important;
        line-height: 24px !important;
        white-space: nowrap !important;
      }
      #${PANEL_ID} .pfh-search-result-toolbar button:hover {
        border-color: rgba(124, 58, 237, .42) !important;
        background: rgba(124, 58, 237, .12) !important;
      }
      #${PANEL_ID} .pfh-search-result-toolbar span {
        margin-left: auto !important;
        color: #6b7897 !important;
        font-size: 12px !important;
        font-weight: 400 !important;
        text-align: right !important;
        white-space: nowrap !important;
      }
      #${PANEL_ID} .pfh-excel-controls {
        display: inline-flex !important;
        align-items: center !important;
        gap: 7px !important;
      }
      #${PANEL_ID} .pfh-excel-controls button[data-action="copywriting-open"] {
        border-color: rgba(124,58,237,.28) !important;
        background: rgba(244,241,255,.72) !important;
        color: #6d35e8 !important;
      }
      #${PANEL_ID} .pfh-copywriting-scroll {
        display: grid !important;
        grid-template-rows: auto minmax(0, 1fr) !important;
        gap: 12px !important;
        height: 100% !important;
        min-width: 0 !important;
        min-height: 0 !important;
        overflow: hidden !important;
        padding-bottom: 12px !important;
      }
      #${PANEL_ID} .pfh-copywriting-hero-section {
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      #${PANEL_ID} .pfh-copywriting-hero-actions {
        display: flex !important;
        align-items: center !important;
        flex-wrap: wrap !important;
        gap: 6px !important;
        margin-top: 5px !important;
      }
      #${PANEL_ID} .pfh-copywriting-hero-actions button {
        height: 27px !important;
        min-height: 27px !important;
        padding: 0 10px !important;
        border: 1px solid rgba(211,204,255,.58) !important;
        border-radius: 9px !important;
        background: rgba(255,255,255,.74) !important;
        color: #675f86 !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.88) !important;
        font-size: 11px !important;
        font-weight: 500 !important;
      }
      #${PANEL_ID} .pfh-copywriting-hero-actions button:hover {
        border-color: rgba(124,58,237,.34) !important;
        background: rgba(244,241,255,.88) !important;
        color: #6d35e8 !important;
      }
      #${PANEL_ID} .pfh-copywriting-hero-actions button.is-icon {
        display: inline-grid !important;
        place-items: center !important;
        width: 28px !important;
        min-width: 28px !important;
        padding: 0 !important;
      }
      #${PANEL_ID} .pfh-copywriting-hero-actions button.is-icon .pfh-icon,
      #${PANEL_ID} .pfh-copywriting-hero-actions button.is-icon svg {
        width: 14px !important;
        height: 14px !important;
      }
      #${PANEL_ID} .pfh-copywriting-page {
        display: grid !important;
        align-content: start !important;
        gap: 9px !important;
        min-width: 0 !important;
        min-height: 0 !important;
        height: 100% !important;
        overflow: hidden !important;
      }
      #${PANEL_ID} .pfh-copywriting-content {
        min-width: 0 !important;
        min-height: 0 !important;
        height: 100% !important;
        overflow: auto !important;
        padding: 18px 20px !important;
        border: 1px solid rgba(211,204,255,.38) !important;
        border-radius: 15px !important;
        background: rgba(255,255,255,.76) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.94), 0 10px 28px rgba(76,64,140,.06) !important;
        scrollbar-width: thin !important;
        scrollbar-color: rgba(139,126,181,.24) transparent !important;
      }
      #${PANEL_ID} .pfh-copywriting-content::-webkit-scrollbar {
        width: 5px !important;
      }
      #${PANEL_ID} .pfh-copywriting-content::-webkit-scrollbar-thumb {
        border-radius: 999px !important;
        background: rgba(139,126,181,.24) !important;
      }
      #${PANEL_ID} .pfh-copywriting-block {
        margin: 0 !important;
        padding: 0 !important;
        border-radius: 8px !important;
        transition: background .18s ease, box-shadow .18s ease !important;
      }
      #${PANEL_ID} .pfh-copywriting-block-head {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
        min-height: 22px !important;
        margin-bottom: 3px !important;
        color: #786bb6 !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        letter-spacing: .02em !important;
      }
      #${PANEL_ID} .pfh-copywriting-block-head button {
        height: 22px !important;
        min-height: 22px !important;
        padding: 0 8px !important;
        border: 1px solid rgba(124,58,237,.20) !important;
        border-radius: 7px !important;
        background: rgba(244,241,255,.72) !important;
        color: #6d35e8 !important;
        font-size: 10px !important;
        font-weight: 600 !important;
        line-height: 20px !important;
      }
      #${PANEL_ID} .pfh-copywriting-block-head button:hover {
        border-color: rgba(124,58,237,.42) !important;
        background: rgba(233,226,255,.92) !important;
      }
      #${PANEL_ID} .pfh-copywriting-block + .pfh-copywriting-block {
        margin-top: 10px !important;
      }
      #${PANEL_ID} .pfh-copywriting-block.is-changed {
        margin-left: -9px !important;
        margin-right: -9px !important;
        padding: 7px 9px !important;
        background: rgba(254,240,138,.42) !important;
        box-shadow: inset 3px 0 0 #eab308 !important;
      }
      #${PANEL_ID} .pfh-copywriting-block pre {
        max-width: 100% !important;
        margin: 0 !important;
        overflow: visible !important;
        color: #24213f !important;
        background: transparent !important;
        font-family: Arial, "Microsoft YaHei", sans-serif !important;
        font-size: 13px !important;
        font-weight: 400 !important;
        line-height: 1.65 !important;
        letter-spacing: 0 !important;
        white-space: pre-wrap !important;
        overflow-wrap: anywhere !important;
        word-break: normal !important;
      }
      #${PANEL_ID} .pfh-copywriting-alert {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        min-width: 0 !important;
        padding: 8px 10px !important;
        border: 1px solid rgba(211,204,255,.44) !important;
        border-radius: 10px !important;
        background: rgba(248,250,252,.78) !important;
        color: #64748b !important;
        font-size: 11px !important;
      }
      #${PANEL_ID} .pfh-copywriting-alert strong {
        flex: 0 0 auto !important;
        color: #30285e !important;
        font-size: 11px !important;
        font-weight: 600 !important;
      }
      #${PANEL_ID} .pfh-copywriting-alert span {
        min-width: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      #${PANEL_ID} .pfh-copywriting-alert.is-update {
        border-color: rgba(234,179,8,.30) !important;
        background: rgba(254,249,195,.56) !important;
        color: #854d0e !important;
      }
      #${PANEL_ID} .pfh-copywriting-alert.is-error {
        border-color: rgba(248,113,113,.26) !important;
        background: rgba(254,242,242,.72) !important;
        color: #b42318 !important;
      }
      #${PANEL_ID} .pfh-copywriting-alert.is-warning {
        border-color: rgba(251,191,36,.26) !important;
        background: rgba(255,251,235,.72) !important;
        color: #92400e !important;
      }
      #${PANEL_ID} .pfh-copywriting-empty {
        display: grid !important;
        place-items: center !important;
        align-content: center !important;
        gap: 8px !important;
        min-height: 220px !important;
        height: 100% !important;
        padding: 24px !important;
        border: 1px dashed rgba(124,58,237,.24) !important;
        border-radius: 15px !important;
        background: rgba(255,255,255,.62) !important;
        color: #7d86a8 !important;
        text-align: center !important;
      }
      #${PANEL_ID} .pfh-copywriting-empty strong {
        color: #30285e !important;
        font-size: 14px !important;
        font-weight: 600 !important;
      }
      #${PANEL_ID} .pfh-copywriting-empty p {
        max-width: 360px !important;
        margin: 0 !important;
        font-size: 12px !important;
        line-height: 1.55 !important;
      }
      #${PANEL_ID} .pfh-copywriting-spinner {
        width: 24px !important;
        height: 24px !important;
        border: 2px solid rgba(124,58,237,.18) !important;
        border-top-color: #7c3aed !important;
        border-radius: 50% !important;
        animation: pfh-copywriting-spin .8s linear infinite !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-bottom {
        padding: 0 14px 14px !important;
      }
      #${PANEL_ID} .pfh-heading strong {
        min-width: 0 !important;
        padding-left: 0 !important;
      }
      #${PANEL_ID} .pfh-heading strong::before,
      #${PANEL_ID} .pfh-heading strong::after {
        display: none;
      }
      #${PANEL_ID} .pfh-collection-mark {
        display: grid;
        place-items: center;
        width: 34px;
        min-width: 34px;
        height: 34px;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 10px;
        color: #fff;
        background: linear-gradient(145deg, #8b5cf6, #6d35e8);
        box-shadow: 0 12px 24px rgba(124, 58, 237, .26);
        cursor: pointer;
        font-size: 17px;
        font-weight: 800;
        line-height: 1;
        transition: transform .14s ease, background .18s ease, box-shadow .18s ease, filter .18s ease;
      }
      #${PANEL_ID} .pfh-collection-mark:not(.is-on) {
        background: #aeb7c5;
        box-shadow: none;
        filter: saturate(.25);
      }
      #${PANEL_ID} .pfh-collection-mark:active {
        transform: scale(.91);
      }
      #${PANEL_ID} .pfh-header {
        display: grid !important;
        grid-template-columns: 34px auto minmax(180px, 1fr) auto !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
      }
      #${PANEL_ID} .pfh-collection-mark {
        grid-column: 1;
      }
      #${PANEL_ID} .pfh-heading strong {
        grid-column: 2;
        align-self: center;
        white-space: nowrap;
      }
      #${PANEL_ID} .pfh-search {
        grid-column: 3;
      }
      #${PANEL_ID} .pfh-header .pfh-actions {
        grid-column: 4;
        align-self: center !important;
        flex-wrap: nowrap !important;
        padding-top: 0 !important;
      }
      #${PANEL_ID} .pfh-upload-mode-tabs {
        position: relative;
        display: grid;
        grid-template-columns: repeat(2, minmax(82px, 1fr));
        width: min(100%, 190px);
        margin-bottom: 8px;
        padding: 3px;
        overflow-x: auto;
        border: 1px solid rgba(211, 204, 255, .56);
        border-radius: 11px;
        background: rgba(244, 241, 255, .58);
        scrollbar-width: none;
      }
      #${PANEL_ID} .pfh-upload-mode-tabs::-webkit-scrollbar {
        display: none;
      }
      #${PANEL_ID} .pfh-upload-mode-tabs button {
        position: relative;
        z-index: 1;
        min-height: 24px;
        padding: 0 6px;
        color: #69728f;
        border: 0;
        background: transparent;
        font-weight: 700;
        transition: color 220ms ease;
      }
      #${PANEL_ID} .pfh-upload-mode-tabs button.is-active {
        color: #fff;
      }
      #${PANEL_ID} .pfh-upload-mode-indicator {
        position: absolute;
        top: 3px;
        bottom: 3px;
        left: 3px;
        width: calc(50% - 3px);
        border-radius: 8px;
        background: linear-gradient(135deg, #8b5cf6, #6d35e8);
        box-shadow: 0 8px 18px rgba(109, 53, 232, .28);
        transform: translateX(0) scale(.96);
        transition: transform 520ms cubic-bezier(.16, 1.42, .34, 1), box-shadow 320ms ease;
      }
      #${PANEL_ID} .pfh-upload-mode-tabs.is-toy-label .pfh-upload-mode-indicator {
        transform: translateX(100%) scale(.96);
        box-shadow: 0 10px 22px rgba(109, 53, 232, .34);
      }
      #${PANEL_ID} .pfh-toy-label-sku-input {
        display: block;
        width: 100%;
        min-height: 112px;
        box-sizing: border-box;
        padding: 10px;
        resize: vertical;
        color: #1f2937;
        border: 1px solid #d9d4f8;
        border-radius: 10px;
        background: rgba(255,255,255,.84);
        font: inherit;
        line-height: 1.55;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-section.is-open {
        min-height: 0 !important;
        height: auto !important;
        grid-template-rows: auto auto auto !important;
        align-content: start !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-scroll {
        scrollbar-gutter: stable;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-title {
        height: 38px !important;
        min-height: 38px !important;
        max-height: 38px !important;
        flex: 0 0 38px !important;
        align-self: start !important;
        padding: 0 0 4px !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-title h3 {
        line-height: 30px !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-guide-button {
        width: 20px !important;
        min-width: 20px !important;
        height: 20px !important;
        min-height: 20px !important;
        margin-left: auto !important;
        padding: 0 !important;
        color: #786bb6;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-guide-button svg {
        display: block;
        width: 100%;
        height: 100%;
        fill: currentColor;
      }
      #${PANEL_ID} .pfh-upload-guide-modal {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: grid;
        place-items: center;
        padding: 18px;
        background: rgba(19, 17, 42, .34);
        backdrop-filter: blur(3px);
      }
      #${PANEL_ID} .pfh-upload-guide-modal section {
        width: min(440px, calc(100vw - 36px));
        max-height: min(540px, calc(100vh - 36px));
        overflow: auto;
        border: 1px solid rgba(211, 204, 255, .7);
        border-radius: 16px;
        background: #fff;
        box-shadow: 0 24px 70px rgba(29, 22, 72, .28);
        animation: pfh-upload-guide-in 360ms cubic-bezier(.16, 1.3, .34, 1);
      }
      #${PANEL_ID} .pfh-upload-guide-modal header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 18px;
        border-bottom: 1px solid #ece9fa;
      }
      #${PANEL_ID} .pfh-upload-guide-modal h3 {
        margin: 0;
        color: #211b4d;
        font-size: 16px;
      }
      #${PANEL_ID} .pfh-upload-guide-modal header button {
        width: 28px;
        height: 28px;
        padding: 0;
        border: 0;
        border-radius: 8px;
        background: #f2effc;
        color: #6757b5;
        font-size: 20px;
        line-height: 1;
      }
      #${PANEL_ID} .pfh-upload-guide-modal article {
        padding: 16px 18px 18px;
        color: #59627c;
        line-height: 1.7;
      }
      #${PANEL_ID} .pfh-upload-guide-modal article b {
        display: block;
        color: #332864;
      }
      #${PANEL_ID} .pfh-upload-guide-modal article p {
        margin: 4px 0 14px;
      }
      #${PANEL_ID} .pfh-upload-guide-modal .pfh-upload-guide-tip {
        margin-bottom: 0;
        padding: 9px 10px;
        border-radius: 10px;
        background: #f5f2ff;
        color: #6e5ead;
      }
      @keyframes pfh-upload-guide-in {
        from { opacity: 0; transform: translateY(10px) scale(.94); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-body {
        grid-template-rows: auto auto auto auto !important;
        min-height: 0 !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-list {
        min-height: 0 !important;
      }
      @keyframes pfh-copywriting-spin {
        to { transform: rotate(360deg); }
      }
      @keyframes pfh-upload-drop-glow {
        0%, 100% { opacity: .48; transform: scale(.985); }
        50% { opacity: .95; transform: scale(1); }
      }
      @keyframes pfh-upload-drop-sweep {
        0%, 58% { transform: translateX(-120%); opacity: 0; }
        70% { opacity: .95; }
        100% { transform: translateX(120%); opacity: 0; }
      }
      #${PANEL_ID} .pfh-ledger-toolbar {
        grid-template-columns: 28px 112px 28px 44px 50px 58px 48px !important;
        align-items: center !important;
      }
      #${PANEL_ID} .pfh-ledger-month,
      #${PANEL_ID} .pfh-ledger-month-label {
        border-color: rgba(139,92,246,.20) !important;
        background: rgba(250,249,255,.92) !important;
        color: #5f35c8 !important;
      }
      #${PANEL_ID} .pfh-ledger-month {
        padding: 0 !important;
        font-size: 20px !important;
        line-height: 1 !important;
      }
      #${PANEL_ID} .pfh-ledger-month-label {
        font-size: 11px !important;
        font-weight: 600 !important;
      }
      #${PANEL_ID} .pfh-ledger-item,
      #${PANEL_ID} .pfh-ledger-item.is-finalized {
        position: relative !important;
        overflow: hidden !important;
        border-color: rgba(215,209,245,.72) !important;
        background: linear-gradient(135deg, rgba(255,255,255,.94), rgba(250,249,255,.76)) !important;
        box-shadow: 0 12px 30px rgba(69,52,130,.07), inset 0 1px 0 rgba(255,255,255,.95) !important;
        transition: transform .34s cubic-bezier(.2,.85,.25,1), box-shadow .34s ease, border-color .34s ease !important;
      }
      #${PANEL_ID} .pfh-ledger-item:hover {
        transform: translateY(-2px) !important;
        border-color: rgba(139,92,246,.34) !important;
        box-shadow: 0 16px 34px rgba(87,64,160,.12), inset 0 1px 0 #fff !important;
      }
      #${PANEL_ID} .pfh-ledger-main,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-main {
        grid-template-rows: auto auto auto auto !important;
        gap: 8px !important;
      }
      #${PANEL_ID} .pfh-ledger-flow {
        display: grid !important;
        grid-template-columns: auto minmax(18px,1fr) auto minmax(18px,1fr) auto !important;
        align-items: center !important;
        max-width: 310px !important;
        color: #9aa4bd !important;
        font-size: 10px !important;
        line-height: 1 !important;
      }
      #${PANEL_ID} .pfh-ledger-flow span {
        display: inline-flex !important;
        align-items: center !important;
        gap: 4px !important;
        white-space: nowrap !important;
      }
      #${PANEL_ID} .pfh-ledger-flow i {
        display: inline-block !important;
        width: 7px !important;
        height: 7px !important;
        border: 2px solid #c7c0e6 !important;
        border-radius: 50% !important;
        background: #fff !important;
        transition: .32s ease !important;
      }
      #${PANEL_ID} .pfh-ledger-flow em {
        height: 2px !important;
        margin: 0 6px !important;
        overflow: hidden !important;
        border-radius: 99px !important;
        background: #e7e3f6 !important;
      }
      #${PANEL_ID} .pfh-ledger-flow.is-step-1 span:nth-child(1),
      #${PANEL_ID} .pfh-ledger-flow.is-step-2 span:nth-child(-n+3),
      #${PANEL_ID} .pfh-ledger-flow.is-step-3 span { color: #6d35e8 !important; }
      #${PANEL_ID} .pfh-ledger-flow.is-step-1 span:nth-child(1) i,
      #${PANEL_ID} .pfh-ledger-flow.is-step-2 span:nth-child(-n+3) i,
      #${PANEL_ID} .pfh-ledger-flow.is-step-3 span i {
        border-color: #7c3aed !important;
        background: #7c3aed !important;
        box-shadow: 0 0 0 4px rgba(124,58,237,.10) !important;
      }
      #${PANEL_ID} .pfh-ledger-flow.is-step-2 em:nth-of-type(1),
      #${PANEL_ID} .pfh-ledger-flow.is-step-3 em {
        background: linear-gradient(90deg, #7c3aed, #c4b5fd) !important;
      }
      #${PANEL_ID} .pfh-ledger-actions button.is-primary {
        border-color: transparent !important;
        background: linear-gradient(135deg, #7444eb, #9468ff) !important;
        color: #fff !important;
        box-shadow: 0 8px 18px rgba(112,68,235,.24) !important;
      }
      #${PANEL_ID} .pfh-ledger-tags .is-priority.is-p0-urgent {
        color: #b42318 !important;
        border-color: rgba(248,113,113,.34) !important;
        background: rgba(254,226,226,.88) !important;
      }
      #${PANEL_ID} .pfh-ledger-tags .is-priority.is-p0-today {
        color: #c24172 !important;
        border-color: rgba(244,114,182,.34) !important;
        background: rgba(252,231,243,.92) !important;
      }
      #${PANEL_ID} .pfh-ledger-time-modal {
        position: absolute !important;
        z-index: 50 !important;
        inset: 0 !important;
        display: grid !important;
        place-items: center !important;
        padding: 18px !important;
        border-radius: 16px !important;
        background: rgba(33,25,73,.20) !important;
        backdrop-filter: blur(7px) !important;
        animation: pfh-ledger-modal-in .24s cubic-bezier(.2,.85,.25,1) both !important;
      }
      #${PANEL_ID} .pfh-ledger-time-card {
        width: min(100%, 340px) !important;
        padding: 16px !important;
        border: 1px solid rgba(255,255,255,.88) !important;
        border-radius: 18px !important;
        background: linear-gradient(145deg, rgba(255,255,255,.98), rgba(248,246,255,.96)) !important;
        box-shadow: 0 24px 55px rgba(39,27,91,.24) !important;
      }
      #${PANEL_ID} .pfh-ledger-time-head,
      #${PANEL_ID} .pfh-ledger-time-actions { display:flex !important; align-items:center !important; justify-content:space-between !important; gap:10px !important; }
      #${PANEL_ID} .pfh-ledger-time-head b { display:block !important; color:#211b4d !important; font-size:15px !important; }
      #${PANEL_ID} .pfh-ledger-time-head span { display:block !important; margin-top:3px !important; color:#8d8aa8 !important; font-size:11px !important; }
      #${PANEL_ID} .pfh-ledger-time-head button { width:28px !important; height:28px !important; padding:0 !important; border:0 !important; border-radius:9px !important; background:#f0ecff !important; color:#6d35e8 !important; font-size:20px !important; }
      #${PANEL_ID} .pfh-ledger-time-fields { display:grid !important; grid-template-columns: 1.45fr 1fr !important; gap:10px !important; margin:16px 0 10px !important; }
      #${PANEL_ID} .pfh-ledger-time-fields label { display:grid !important; gap:6px !important; color:#73708d !important; font-size:11px !important; }
      #${PANEL_ID} .pfh-ledger-time-fields input { width:100% !important; height:36px !important; box-sizing:border-box !important; padding:0 10px !important; border:1px solid rgba(167,139,250,.32) !important; border-radius:10px !important; outline:0 !important; background:#fff !important; color:#30285e !important; font-size:13px !important; font-variant-numeric:tabular-nums !important; }
      #${PANEL_ID} .pfh-ledger-time-fields input:focus { border-color:#8b5cf6 !important; box-shadow:0 0 0 3px rgba(139,92,246,.12) !important; }
      #${PANEL_ID} .pfh-ledger-time-clock { display:grid !important; grid-template-columns:1fr 10px 1fr !important; align-items:center !important; gap:4px !important; }
      #${PANEL_ID} .pfh-ledger-time-clock i { color:#978fba !important; font-style:normal !important; text-align:center !important; }
      #${PANEL_ID} .pfh-ledger-time-presets { display:flex !important; flex-wrap:wrap !important; gap:7px !important; margin:0 0 16px !important; }
      #${PANEL_ID} .pfh-ledger-time-presets button, #${PANEL_ID} .pfh-ledger-time-actions button { height:30px !important; padding:0 10px !important; border:1px solid rgba(167,139,250,.24) !important; border-radius:9px !important; background:#f6f3ff !important; color:#6741cc !important; font-size:11px !important; }
      #${PANEL_ID} .pfh-ledger-time-actions { justify-content:flex-end !important; }
      #${PANEL_ID} .pfh-ledger-time-actions .is-primary { border-color:transparent !important; background:linear-gradient(135deg,#7444eb,#9468ff) !important; color:#fff !important; box-shadow:0 8px 18px rgba(112,68,235,.24) !important; }
      @keyframes pfh-ledger-modal-in { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:scale(1); } }
      #${PANEL_ID} .pfh-ledger-item,
      #${PANEL_ID} .pfh-ledger-item.is-finalized {
        grid-template-columns: 132px minmax(0,1fr) !important;
        grid-template-areas: "thumb main" !important;
        min-height: 156px !important;
        padding: 18px !important;
        border-color: #e7e9f1 !important;
        border-radius: 18px !important;
        background: #fff !important;
        box-shadow: none !important;
      }
      #${PANEL_ID} .pfh-ledger-item:hover {
        transform: translateY(-1px) !important;
        border-color: #ded7ff !important;
        box-shadow: 0 8px 22px rgba(44,35,92,.06) !important;
      }
      #${PANEL_ID} .pfh-ledger-thumb,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-thumb {
        width: 132px !important;
        height: 132px !important;
        border: 0 !important;
        border-radius: 16px !important;
        background: #f5f2ff !important;
      }
      #${PANEL_ID} .pfh-ledger-main,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-main {
        grid-template-rows: auto auto auto auto auto !important;
        align-content: start !important;
        gap: 8px !important;
      }
      #${PANEL_ID} .pfh-ledger-main .pfh-ledger-tags,
      #${PANEL_ID} .pfh-ledger-main .pfh-ledger-status,
      #${PANEL_ID} .pfh-ledger-main .pfh-ledger-actions,
      #${PANEL_ID} .pfh-ledger-main .pfh-ledger-file-actions { grid-area:auto !important; }
      #${PANEL_ID} .pfh-ledger-title-row { grid-template-columns:minmax(0,1fr) 32px auto !important; }
      #${PANEL_ID} .pfh-ledger-main b {
        font-size: 19px !important;
        font-weight: 650 !important;
        letter-spacing: -.02em !important;
      }
      #${PANEL_ID} .pfh-ledger-tags { gap: 8px !important; }
      #${PANEL_ID} .pfh-ledger-tags span {
        height: 27px !important;
        min-height: 27px !important;
        padding: 0 11px !important;
        border-radius: 999px !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        line-height: 25px !important;
        box-shadow: none !important;
      }
      #${PANEL_ID} .pfh-ledger-tags .is-sku { border-color:#cbbcff !important; background:#fbfaff !important; color:#7958e9 !important; }
      #${PANEL_ID} .pfh-ledger-tags .is-design-type { border-color:#ffd29a !important; background:#fff9f0 !important; color:#e99b22 !important; }
      #${PANEL_ID} .pfh-ledger-assignment { display:flex !important; align-items:center !important; gap:8px !important; color:#8a94ae !important; font-size:12px !important; }
      #${PANEL_ID} .pfh-ledger-flow { max-width:260px !important; margin-top:1px !important; font-size:10px !important; }
      #${PANEL_ID} .pfh-ledger-actions { justify-content:flex-end !important; gap:10px !important; margin-top:auto !important; }
      #${PANEL_ID} .pfh-ledger-actions button.is-primary {
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        gap:6px !important;
        min-width: 116px !important;
        height: 40px !important;
        padding: 0 16px !important;
        border: 1px solid #bca9ff !important;
        border-radius: 12px !important;
        background: #fff !important;
        color: #7048df !important;
        box-shadow: none !important;
        font-size: 14px !important;
        font-weight: 650 !important;
      }
      #${PANEL_ID} .pfh-ledger-actions button.is-primary.is-finalize {
        min-width: 132px !important;
        border-color: #7c3aed !important;
        background: #7c3aed !important;
        color: #fff !important;
        animation: pfh-ledger-finalize-ready .46s cubic-bezier(.2,.85,.25,1) both !important;
      }
      #${PANEL_ID} .pfh-ledger-actions button.is-primary.is-finalize i { display:inline-grid !important; place-items:center !important; width:16px !important; height:16px !important; border-radius:50% !important; background:rgba(255,255,255,.22) !important; font-style:normal !important; font-size:10px !important; }
      #${PANEL_ID} .pfh-ledger-actions button.is-primary.is-finalize em { padding-left:5px !important; border-left:1px solid rgba(255,255,255,.35) !important; color:#ede9fe !important; font-size:10px !important; font-style:normal !important; font-weight:400 !important; }
      #${PANEL_ID} .pfh-ledger-complete { display:inline-flex !important; align-items:center !important; height:40px !important; padding:0 15px !important; border-radius:12px !important; background:#f1ecff !important; color:#6d35e8 !important; font-size:13px !important; font-weight:600 !important; }
      #${PANEL_ID} .pfh-ledger-more { position:relative !important; display:inline-flex !important; }
      #${PANEL_ID} .pfh-ledger-more > button { width:40px !important; min-width:40px !important; height:40px !important; min-height:40px !important; padding:0 !important; border:1px solid #cbbcff !important; border-radius:12px !important; background:#fff !important; color:#6d35e8 !important; font-size:17px !important; line-height:1 !important; letter-spacing:1px !important; }
      #${PANEL_ID} .pfh-ledger-overflow-menu { position:absolute !important; z-index:8 !important; right:0 !important; bottom:calc(100% + 7px) !important; display:grid !important; min-width:104px !important; padding:5px !important; border:1px solid #ded7ff !important; border-radius:12px !important; background:#fff !important; box-shadow:0 12px 28px rgba(48,37,98,.13) !important; animation:pfh-ledger-menu-in .18s ease both !important; }
      #${PANEL_ID} .pfh-ledger-overflow-menu button { height:30px !important; min-height:30px !important; padding:0 9px !important; border:0 !important; border-radius:8px !important; background:transparent !important; color:#655d86 !important; text-align:left !important; font-size:11px !important; }
      #${PANEL_ID} .pfh-ledger-overflow-menu button:hover { background:#f5f2ff !important; color:#673bdb !important; }
      #${PANEL_ID} .pfh-ledger-file-actions { grid-template-columns:repeat(3,minmax(70px,1fr)) 40px !important; align-items:end !important; max-width:430px !important; margin: auto 0 0 auto !important; }
      #${PANEL_ID} .pfh-ledger-file-actions .pfh-ledger-more { align-self:end !important; }
      @keyframes pfh-ledger-finalize-ready { from { opacity:.35; transform:translateX(-16px) scale(.92); } to { opacity:1; transform:translateX(0) scale(1); } }
      @keyframes pfh-ledger-menu-in { from { opacity:0; transform:translateY(4px) scale(.96); } to { opacity:1; transform:translateY(0) scale(1); } }
      @media (max-width: 760px) {
        #${PANEL_ID} .pfh-ledger-item,
        #${PANEL_ID} .pfh-ledger-item.is-finalized,
        #${PANEL_ID}.is-narrow-panel .pfh-ledger-item,
        #${PANEL_ID}.is-narrow-panel .pfh-ledger-item.is-finalized { grid-template-columns:94px minmax(0,1fr) !important; min-height:118px !important; padding:12px !important; }
        #${PANEL_ID} .pfh-ledger-thumb,
        #${PANEL_ID}.is-narrow-panel .pfh-ledger-thumb { width:94px !important; height:94px !important; border-radius:13px !important; }
        #${PANEL_ID} .pfh-ledger-main b { font-size:15px !important; }
        #${PANEL_ID} .pfh-ledger-tags span { height:23px !important; min-height:23px !important; padding:0 8px !important; font-size:10px !important; line-height:21px !important; }
        #${PANEL_ID} .pfh-ledger-flow { display:none !important; }
        #${PANEL_ID} .pfh-ledger-actions button.is-primary { height:34px !important; min-width:96px !important; font-size:12px !important; }
        #${PANEL_ID} .pfh-ledger-more > button { width:34px !important; min-width:34px !important; height:34px !important; min-height:34px !important; }
        #${PANEL_ID} .pfh-ledger-toolbar { grid-template-columns: 28px 1fr 28px repeat(4, auto) !important; }
        #${PANEL_ID}[data-view="upload"] .pfh-upload-info-grid {
          grid-template-columns: 1fr !important;
        }
        #${PANEL_ID}[data-view="upload"] .pfh-upload-title {
          flex-wrap: wrap !important;
        }
        #${PANEL_ID}[data-view="upload"] .pfh-upload-title > button:first-of-type {
          margin-left: 0 !important;
        }
      }
      #${PANEL_ID} .pfh-ledger-item,
      #${PANEL_ID} .pfh-ledger-item.is-finalized,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-item,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-item.is-finalized {
        grid-template-columns: 76px minmax(0, 1fr) !important;
        grid-template-areas: "thumb main" !important;
        align-items: center !important;
        gap: 12px !important;
        min-height: 108px !important;
        padding: 12px 14px !important;
        overflow: visible !important;
        border-radius: 15px !important;
      }
      #${PANEL_ID} .pfh-ledger-thumb,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-thumb {
        width: 76px !important;
        height: 76px !important;
        align-self: center !important;
        border-radius: 12px !important;
      }
      #${PANEL_ID} .pfh-ledger-main,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-main {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        grid-template-rows: auto auto auto auto !important;
        gap: 5px !important;
        min-width: 0 !important;
        overflow: visible !important;
      }
      #${PANEL_ID} .pfh-ledger-title-row {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) 28px auto !important;
        align-items: center !important;
        gap: 6px !important;
        min-width: 0 !important;
      }
      #${PANEL_ID} .pfh-ledger-title { min-width:0 !important; overflow:hidden !important; }
      #${PANEL_ID} .pfh-ledger-main b {
        display: block !important;
        max-width: 100% !important;
        overflow: hidden !important;
        color: #17153f !important;
        font-size: 15px !important;
        font-weight: 600 !important;
        line-height: 1.25 !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      #${PANEL_ID} .pfh-ledger-link {
        width: 28px !important;
        height: 28px !important;
        min-height: 28px !important;
        border: 0 !important;
        border-radius: 9px !important;
        background: #f7f4ff !important;
      }
      #${PANEL_ID} .pfh-ledger-status,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-status {
        padding: 5px 8px !important;
        border-radius: 9px !important;
        font-size: 10px !important;
        font-weight: 400 !important;
        line-height: 1 !important;
      }
      #${PANEL_ID} .pfh-ledger-tags {
        display: flex !important;
        flex-wrap: nowrap !important;
        gap: 6px !important;
        min-width: 0 !important;
        overflow: hidden !important;
      }
      #${PANEL_ID} .pfh-ledger-tags span {
        flex: 0 1 auto !important;
        max-width: 130px !important;
        height: 21px !important;
        min-height: 21px !important;
        padding: 0 7px !important;
        overflow: hidden !important;
        border-radius: 999px !important;
        font-size: 10px !important;
        font-weight: 400 !important;
        line-height: 19px !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      #${PANEL_ID} .pfh-ledger-assignment {
        min-height: 16px !important;
        color: #929bb2 !important;
        font-size: 10px !important;
        line-height: 16px !important;
      }
      #${PANEL_ID} .pfh-ledger-bottom {
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        min-width: 0 !important;
        min-height: 30px !important;
      }
      #${PANEL_ID} .pfh-ledger-flow,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-flow {
        display: grid !important;
        flex: 1 1 auto !important;
        grid-template-columns: auto minmax(12px,1fr) auto minmax(12px,1fr) auto !important;
        min-width: 150px !important;
        max-width: none !important;
        margin: 0 !important;
        font-size: 9px !important;
      }
      #${PANEL_ID} .pfh-ledger-actions,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-actions {
        display: flex !important;
        flex: 0 0 auto !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
        justify-content: flex-end !important;
        gap: 6px !important;
        margin: 0 !important;
      }
      #${PANEL_ID} .pfh-ledger-actions button.is-primary,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-actions button.is-primary {
        min-width: 68px !important;
        width: auto !important;
        height: 30px !important;
        min-height: 30px !important;
        padding: 0 10px !important;
        border-radius: 9px !important;
        font-size: 11px !important;
      }
      #${PANEL_ID} .pfh-ledger-actions button.is-primary.is-finalize { min-width: 94px !important; }
      #${PANEL_ID} .pfh-ledger-actions button.is-primary.is-finalize i { width:14px !important; height:14px !important; }
      #${PANEL_ID} .pfh-ledger-actions button.is-primary.is-finalize em { font-size:9px !important; }
      #${PANEL_ID} .pfh-ledger-complete { height:30px !important; padding:0 10px !important; border-radius:9px !important; font-size:10px !important; font-weight:400 !important; }
      #${PANEL_ID} .pfh-ledger-more > button,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-more > button {
        width: 30px !important;
        min-width: 30px !important;
        height: 30px !important;
        min-height: 30px !important;
        border-radius: 9px !important;
        font-size: 13px !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions {
        display: grid !important;
        flex: 0 0 auto !important;
        grid-template-columns: repeat(3, minmax(54px, 64px)) 30px !important;
        gap: 5px !important;
        max-width: none !important;
        margin: 0 !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions button { height:30px !important; min-height:30px !important; padding:0 8px !important; border-radius:9px !important; font-size:10px !important; }
      #${PANEL_ID} .pfh-ledger-page,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-page {
        grid-template-rows: auto auto auto minmax(0,1fr) !important;
        gap: 8px !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      #${PANEL_ID} .pfh-ledger-toolbar,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-toolbar {
        display: flex !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
        gap: 5px !important;
        min-width: 0 !important;
        overflow: hidden !important;
      }
      #${PANEL_ID} .pfh-ledger-toolbar button,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-toolbar button {
        flex: 0 0 auto !important;
        width: auto !important;
        min-width: 36px !important;
        height: 27px !important;
        min-height: 27px !important;
        padding: 0 8px !important;
        border-radius: 8px !important;
        font-size: 10px !important;
      }
      #${PANEL_ID} .pfh-ledger-toolbar .pfh-ledger-month { min-width:27px !important; width:27px !important; padding:0 !important; font-size:16px !important; }
      #${PANEL_ID} .pfh-ledger-toolbar .pfh-ledger-month-label { min-width:88px !important; width:88px !important; padding:0 6px !important; }
      #${PANEL_ID} .pfh-ledger-bottom { justify-content:space-between !important; gap:10px !important; }
      #${PANEL_ID} .pfh-ledger-flow,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-flow {
        flex: 0 1 205px !important;
        width: 205px !important;
        min-width: 125px !important;
        max-width: 205px !important;
      }
      #${PANEL_ID} .pfh-ledger-flow.is-step-2 em:nth-of-type(1),
      #${PANEL_ID} .pfh-ledger-flow.is-step-3 em {
        background: linear-gradient(90deg,#7c3aed,#c4b5fd,#7c3aed) !important;
        background-size: 220% 100% !important;
        animation: pfh-ledger-flow-shimmer 2.4s cubic-bezier(.45,0,.2,1) infinite !important;
      }
      #${PANEL_ID} .pfh-ledger-flow.is-step-1 span:nth-child(1) i,
      #${PANEL_ID} .pfh-ledger-flow.is-step-2 span:nth-child(3) i,
      #${PANEL_ID} .pfh-ledger-flow.is-step-3 span:nth-child(5) i {
        animation: pfh-ledger-node-pulse 2s ease-in-out infinite !important;
      }
      #${PANEL_ID} .pfh-ledger-link,
      #${PANEL_ID} .pfh-ledger-status,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-status {
        box-sizing: border-box !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        height: 28px !important;
        min-height: 28px !important;
        line-height: 1 !important;
      }
      #${PANEL_ID} .pfh-ledger-more > button,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-more > button {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0 0 5px !important;
        font-family: Arial, sans-serif !important;
        font-size: 20px !important;
        font-weight: 400 !important;
        line-height: 1 !important;
        letter-spacing: 0 !important;
      }
      @keyframes pfh-ledger-flow-shimmer { 0% { background-position:100% 0; } 100% { background-position:-110% 0; } }
      @keyframes pfh-ledger-node-pulse { 0%,100% { box-shadow:0 0 0 3px rgba(124,58,237,.08); } 50% { box-shadow:0 0 0 6px rgba(124,58,237,.16); } }
      #${PANEL_ID} .pfh-ledger-item.is-finalized .pfh-ledger-bottom {
        display: grid !important;
        grid-template-columns: minmax(150px, 1fr) auto !important;
        align-items: center !important;
        gap: 8px !important;
      }
      #${PANEL_ID} .pfh-ledger-item.is-finalized .pfh-ledger-flow {
        width: min(205px, 100%) !important;
        min-width: 130px !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions {
        grid-auto-flow: column !important;
        grid-template-columns: 56px 56px 56px 30px !important;
        grid-template-rows: 30px !important;
        width: 213px !important;
        min-width: 213px !important;
        align-items: center !important;
        overflow: visible !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions > button {
        width: 56px !important;
        min-width: 0 !important;
        max-width: 56px !important;
        white-space: nowrap !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions .pfh-ledger-more,
      #${PANEL_ID} .pfh-ledger-file-actions .pfh-ledger-more > button {
        width: 30px !important;
        min-width: 30px !important;
        max-width: 30px !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions button.is-skip {
        border: 1px solid #d6dae3 !important;
        background: #f1f3f6 !important;
        color: #7e8799 !important;
        text-decoration: none !important;
        box-shadow: none !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions button.is-skip::before,
      #${PANEL_ID} .pfh-ledger-file-actions button.is-skip em {
        display: none !important;
        content: none !important;
      }
      #${PANEL_ID} .pfh-ledger-price {
        display: inline-flex !important;
        align-items: center !important;
        flex: 0 0 72px !important;
        width: 72px !important;
        height: 30px !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        border: 1px solid #d9d1f5 !important;
        border-radius: 9px !important;
        background: #fff !important;
        color: #8a78c7 !important;
      }
      #${PANEL_ID} .pfh-ledger-price > span {
        flex: 0 0 22px !important;
        text-align: right !important;
        font-size: 11px !important;
      }
      #${PANEL_ID} .pfh-ledger-price input {
        width: 48px !important;
        height: 28px !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
        padding: 0 6px 0 3px !important;
        border: 0 !important;
        outline: 0 !important;
        background: transparent !important;
        color: #352765 !important;
        font-size: 11px !important;
        font-variant-numeric: tabular-nums !important;
      }
      #${PANEL_ID} .pfh-ledger-price:focus-within {
        border-color: #9f82f4 !important;
        box-shadow: 0 0 0 3px rgba(124,58,237,.09) !important;
      }
      #${PANEL_ID} .pfh-ledger-item,
      #${PANEL_ID} .pfh-ledger-item:hover {
        transform: none !important;
        transition: border-color .2s ease, box-shadow .2s ease !important;
      }
      #${PANEL_ID} .pfh-ledger-more > button,
      #${PANEL_ID}.is-narrow-panel .pfh-ledger-more > button {
        padding: 0 !important;
        border-color: #bca9ff !important;
        font-size: 0 !important;
        line-height: 0 !important;
      }
      #${PANEL_ID} .pfh-more-dots {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 2px !important;
        width: 100% !important;
        height: 100% !important;
        padding: 0 !important;
        line-height: 0 !important;
      }
      #${PANEL_ID} .pfh-more-dots i {
        display: block !important;
        flex: 0 0 3px !important;
        width: 3px !important;
        height: 3px !important;
        border-radius: 50% !important;
        background: currentColor !important;
      }
      #${PANEL_ID} .pfh-ledger-overflow-menu {
        transform-origin: right bottom !important;
        animation: pfh-ledger-menu-spring .3s cubic-bezier(.18,.89,.32,1.28) both !important;
        will-change: transform, opacity !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions > button {
        border-color: #bca9ff !important;
        color: #7048df !important;
        background: #fff !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions > button.is-done {
        border-color: #bca9ff !important;
        background: #7c3aed !important;
        color: #fff !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions > button.is-skip {
        border-color: #d6dae3 !important;
        background: #f1f3f6 !important;
        color: #7e8799 !important;
      }
      @keyframes pfh-ledger-menu-spring {
        0% { opacity:0; transform:translateY(8px) scale(.82); }
        68% { opacity:1; transform:translateY(-1px) scale(1.025); }
        100% { opacity:1; transform:translateY(0) scale(1); }
      }
      #${PANEL_ID} .pfh-ledger-actions button.is-primary.is-finalize .pfh-ledger-finalize-check {
        display: block !important;
        flex: 0 0 14px !important;
        width: 14px !important;
        height: 14px !important;
        fill: currentColor !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-guide-button,
      #${PANEL_ID}[data-view="upload"] .pfh-upload-guide-button:hover,
      #${PANEL_ID}[data-view="upload"] .pfh-upload-guide-button:focus-visible {
        color: #7c3aed !important;
      }
      #${PANEL_ID}[data-view="upload"] .pfh-upload-guide-button svg,
      #${PANEL_ID}[data-view="upload"] .pfh-upload-guide-button svg path {
        fill: currentColor !important;
      }
      #${PANEL_ID} .pfh-ledger-actions button.is-primary.is-finalize {
        animation: none !important;
      }
      #${PANEL_ID} .pfh-ledger-actions button.is-primary.is-finalize.is-flow-transition {
        animation: pfh-ledger-finalize-transition .56s cubic-bezier(.16,1.34,.3,1) both !important;
      }
      #${PANEL_ID} .pfh-ledger-price.is-flow-transition {
        animation: pfh-ledger-price-transition .48s cubic-bezier(.16,1.34,.3,1) .05s both !important;
      }
      #${PANEL_ID} .pfh-ledger-file-actions > button.is-pending {
        border-color: #bca9ff !important;
        color: #7048df !important;
        background: #fff !important;
      }
      @keyframes pfh-ledger-finalize-transition {
        0% { opacity:0; transform:translateX(-20px) scale(.76); filter:blur(2px); }
        62% { opacity:1; transform:translateX(2px) scale(1.045); filter:blur(0); }
        100% { opacity:1; transform:translateX(0) scale(1); }
      }
      @keyframes pfh-ledger-price-transition {
        0% { opacity:0; transform:translateX(-10px) scale(.84); }
        72% { opacity:1; transform:translateX(1px) scale(1.03); }
        100% { opacity:1; transform:translateX(0) scale(1); }
      }
      #${PANEL_ID} .pfh-ledger-tabs button.is-tab-transition {
        animation: pfh-ledger-tab-elastic .46s cubic-bezier(.16,1.42,.3,1) both !important;
      }
      @keyframes pfh-ledger-tab-elastic {
        0% { opacity:.25; transform:translateY(3px) scale(.78); }
        62% { opacity:1; transform:translateY(-1px) scale(1.08); }
        100% { opacity:1; transform:translateY(0) scale(1); }
      }
      #${PANEL_ID} .pfh-ledger-overflow-menu {
        top: calc(100% + 7px) !important;
        bottom: auto !important;
        transform-origin: right top !important;
      }
      #${PANEL_ID} .pfh-list {
        overflow: visible !important;
      }
      #${PANEL_ID} .pfh-sku-scroll {
        box-sizing: border-box !important;
        padding: 6px 8px 10px !important;
      }
      #${PANEL_ID}[data-view="sizeImage"] .pfh-detail {
        overflow: hidden;
        container-type: inline-size;
      }
      #${PANEL_ID}[data-view="sizeImage"] .pfh-main {
        padding: 10px 12px 12px;
      }
      #${PANEL_ID} .pfh-size-image-scroll {
        height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
        padding: 12px;
        box-sizing: border-box;
      }
      #${PANEL_ID} .pfh-size-image-page {
        width: 100%;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        gap: 12px;
        box-sizing: border-box;
      }
      #${PANEL_ID} .pfh-size-image-hero {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 16px 18px;
        border: 1px solid rgba(211, 204, 255, .45);
        border-radius: 16px;
        background: linear-gradient(135deg, rgba(255,255,255,.82), rgba(245,242,255,.64));
        box-shadow: inset 0 1px 0 rgba(255,255,255,.92), 0 12px 30px rgba(94,70,170,.08);
      }
      #${PANEL_ID} .pfh-size-image-hero small {
        color: #8c75d8;
        font-size: 10px;
        font-weight: 760;
        letter-spacing: .14em;
      }
      #${PANEL_ID} .pfh-size-image-hero h3 {
        margin: 3px 0 2px;
        color: #21194f;
        font-size: 17px;
        overflow-wrap: anywhere;
      }
      #${PANEL_ID} .pfh-size-image-hero p {
        margin: 0;
        color: #737b9f;
        font-size: 11px;
      }
      #${PANEL_ID} .pfh-size-image-workspace {
        width: 100%;
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, .94fr) minmax(0, 1.06fr);
        gap: 12px;
        flex: 1 1 auto;
        box-sizing: border-box;
      }
      #${PANEL_ID} .pfh-size-image-controls,
      #${PANEL_ID} .pfh-size-image-preview,
      #${PANEL_ID} .pfh-size-image-placeholder,
      #${PANEL_ID} .pfh-size-image-empty {
        min-width: 0;
        box-sizing: border-box;
        border: 1px solid rgba(211,204,255,.42);
        border-radius: 16px;
        background: rgba(255,255,255,.64);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.9);
      }
      #${PANEL_ID} .pfh-size-image-controls {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 13px;
      }
      #${PANEL_ID} .pfh-size-image-spec {
        display: grid;
        gap: 5px;
        padding: 12px;
        border-radius: 13px;
        background: linear-gradient(145deg, rgba(248,245,255,.86), rgba(240,249,255,.72));
      }
      #${PANEL_ID} .pfh-size-image-spec span,
      #${PANEL_ID} .pfh-size-image-spec small,
      #${PANEL_ID} .pfh-size-image-file {
        color: #7c83a4;
        font-size: 11px;
        line-height: 1.55;
      }
      #${PANEL_ID} .pfh-size-image-spec b {
        color: #33236c;
        font-size: 15px;
      }
      #${PANEL_ID} .pfh-size-image-remark {
        min-width: 0;
        display: grid;
        grid-template-columns: 16px minmax(0, 1fr);
        gap: 2px 7px;
        align-items: center;
        padding: 8px 10px;
        color: #4e4379;
        border: 1px solid rgba(167,139,250,.22);
        border-radius: 11px;
        background: rgba(250,248,255,.72);
        cursor: pointer;
      }
      #${PANEL_ID} .pfh-size-image-remark input {
        width: 14px;
        height: 14px;
        margin: 0;
        accent-color: #7c3aed;
      }
      #${PANEL_ID} .pfh-size-image-remark span {
        font-size: 11px;
        font-weight: 700;
      }
      #${PANEL_ID} .pfh-size-image-remark small {
        grid-column: 2;
        min-width: 0;
        color: #8a91ae;
        font-size: 10px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #${PANEL_ID} .pfh-size-image-remark-editor,
      #${PANEL_ID} .pfh-size-image-options {
        min-width: 0;
        padding: 8px 10px;
        color: #4e4379;
        border: 1px solid rgba(167,139,250,.22);
        border-radius: 11px;
        background: rgba(250,248,255,.72);
        box-sizing: border-box;
      }
      #${PANEL_ID} .pfh-size-image-remark-editor > span {
        display: block;
        margin-bottom: 6px;
        font-size: 11px;
        font-weight: 700;
      }
      #${PANEL_ID} .pfh-size-image-remark-editor > div {
        display: grid;
        gap: 5px;
      }
      #${PANEL_ID} .pfh-size-image-remark-editor label {
        min-width: 0;
        display: grid;
        grid-template-columns: 32px minmax(0, 1fr);
        align-items: center;
        gap: 6px;
        font-size: 10px;
      }
      #${PANEL_ID} .pfh-size-image-remark-editor input {
        width: 100%;
        min-width: 0;
        height: 28px;
        padding: 4px 8px;
        color: #352766;
        border: 1px solid rgba(167,139,250,.28);
        border-radius: 8px;
        background: rgba(255,255,255,.9);
        box-sizing: border-box;
        outline: none;
        font-size: 11px;
      }
      #${PANEL_ID} .pfh-size-image-remark-editor input:focus {
        border-color: rgba(124,58,237,.58);
        box-shadow: 0 0 0 3px rgba(124,58,237,.08);
      }
      #${PANEL_ID} .pfh-size-image-options {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      #${PANEL_ID} .pfh-size-image-options label {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
      }
      #${PANEL_ID} .pfh-size-image-options input {
        width: 14px;
        height: 14px;
        margin: 0;
        accent-color: #7c3aed;
      }
      #${PANEL_ID} .pfh-size-image-drop {
        min-height: 132px;
        display: grid;
        place-items: center;
        align-content: center;
        gap: 7px;
        padding: 15px !important;
        border: 1px dashed rgba(124,58,237,.42) !important;
        border-radius: 14px !important;
        background: rgba(249,247,255,.74) !important;
        white-space: normal !important;
      }
      #${PANEL_ID} .pfh-size-image-drop:hover {
        transform: translateY(-1px);
        border-color: rgba(124,58,237,.7) !important;
        box-shadow: 0 12px 24px rgba(124,58,237,.1);
      }
      #${PANEL_ID} .pfh-size-image-drop.is-paste-received {
        border-color: rgba(34,197,94,.78) !important;
        background: rgba(236,253,245,.9) !important;
        box-shadow: 0 0 0 4px rgba(34,197,94,.12);
      }
      #${PANEL_ID} .pfh-size-image-drop.is-processing {
        position: relative;
        overflow: hidden;
        border-style: solid !important;
        border-color: rgba(124,58,237,.34) !important;
        background: linear-gradient(135deg, rgba(246,241,255,.94), rgba(238,247,255,.9)) !important;
        cursor: wait;
      }
      #${PANEL_ID} .pfh-size-image-drop.is-processing::after {
        content: '';
        position: absolute;
        left: -45%;
        bottom: 0;
        width: 45%;
        height: 3px;
        border-radius: 999px;
        background: linear-gradient(90deg, transparent, #7c3aed, #60a5fa, transparent);
        animation: pfh-size-image-progress 1.25s ease-in-out infinite;
      }
      #${PANEL_ID} .pfh-size-image-spinner,
      #${PANEL_ID} .pfh-size-image-status.is-processing > i {
        width: 28px;
        height: 28px;
        border: 3px solid rgba(124,58,237,.18);
        border-top-color: #7c3aed;
        border-radius: 50%;
        box-sizing: border-box;
        animation: pfh-size-image-spin .78s linear infinite;
      }
      #${PANEL_ID} .pfh-size-image-drop .pfh-icon {
        width: 34px;
        height: 34px;
        color: #7c3aed;
      }
      #${PANEL_ID} .pfh-size-image-drop strong {
        color: #34256f;
        font-size: 13px;
      }
      #${PANEL_ID} .pfh-size-image-drop span:not(.pfh-icon) {
        color: #8a91ae;
        font-size: 11px;
      }
      #${PANEL_ID} .pfh-size-image-file {
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #${PANEL_ID} .pfh-size-image-actions {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
        margin-top: auto;
      }
      #${PANEL_ID} .pfh-size-image-actions button {
        min-height: 34px;
        min-width: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 4px 6px;
        border-radius: 10px;
        font-size: 11px;
        overflow: hidden;
      }
      #${PANEL_ID} .pfh-size-image-actions .pfh-icon {
        width: 15px;
        height: 15px;
        flex: 0 0 15px;
        border: 0;
        background: transparent;
        box-shadow: none;
      }
      #${PANEL_ID} .pfh-size-image-actions .pfh-icon svg {
        width: 15px;
        height: 15px;
      }
      #${PANEL_ID} .pfh-size-image-actions button.is-primary {
        color: #fff;
        border-color: #7c3aed;
        background: linear-gradient(135deg, #8b5cf6, #6d35e8);
      }
      #${PANEL_ID} .pfh-size-image-file-input {
        display: none;
      }
      #${PANEL_ID} .pfh-size-image-status {
        padding: 9px 11px;
        border-radius: 10px;
        font-size: 11px;
        line-height: 1.5;
      }
      #${PANEL_ID} .pfh-size-image-status.is-error {
        color: #a33a48;
        border: 1px solid rgba(220,90,112,.22);
        background: rgba(255,239,243,.8);
      }
      #${PANEL_ID} .pfh-size-image-status.is-ready {
        color: #24705c;
        border: 1px solid rgba(64,170,135,.22);
        background: rgba(235,252,246,.8);
      }
      #${PANEL_ID} .pfh-size-image-status.is-processing {
        position: relative;
        display: grid;
        grid-template-columns: 18px minmax(0, 1fr);
        align-items: center;
        gap: 8px;
        overflow: hidden;
        color: #5b3aa8;
        border: 1px solid rgba(124,58,237,.18);
        background: rgba(246,241,255,.86);
      }
      #${PANEL_ID} .pfh-size-image-status.is-processing > i {
        width: 17px;
        height: 17px;
        border-width: 2px;
      }
      #${PANEL_ID} .pfh-size-image-status.is-processing > em {
        position: absolute;
        left: -40%;
        bottom: 0;
        width: 40%;
        height: 2px;
        background: linear-gradient(90deg, transparent, #7c3aed, transparent);
        animation: pfh-size-image-progress 1.2s ease-in-out infinite;
      }
      @keyframes pfh-size-image-spin { to { transform: rotate(360deg); } }
      @keyframes pfh-size-image-progress { 0% { left: -45%; } 100% { left: 105%; } }
      #${PANEL_ID} .pfh-size-image-preview-grid {
        min-width: 0;
        min-height: 310px;
        display: grid;
        grid-template-rows: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
      #${PANEL_ID} .pfh-size-image-preview,
      #${PANEL_ID} .pfh-size-image-placeholder {
        min-width: 0;
        min-height: 310px;
        display: grid;
        place-items: center;
        overflow: hidden;
        padding: 8px;
        box-sizing: border-box;
        position: relative;
      }
      #${PANEL_ID} .pfh-size-image-preview-grid > .pfh-size-image-preview,
      #${PANEL_ID} .pfh-size-image-preview-grid > .pfh-size-image-placeholder {
        min-height: 0;
        height: 100%;
      }
      #${PANEL_ID} .pfh-size-image-preview-type {
        position: absolute;
        top: 8px;
        left: 8px;
        z-index: 1;
        padding: 3px 7px;
        color: #6d35e8;
        border: 1px solid rgba(124,58,237,.16);
        border-radius: 999px;
        background: rgba(255,255,255,.86);
        font-size: 10px;
      }
      #${PANEL_ID} .pfh-size-image-preview img {
        display: block;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 10px;
        box-shadow: 0 10px 28px rgba(39,30,82,.12);
      }
      #${PANEL_ID} .pfh-size-image-placeholder {
        align-content: center;
        gap: 8px;
        color: #8b91b2;
        text-align: center;
        background: linear-gradient(145deg, rgba(255,255,255,.72), rgba(247,244,255,.58));
      }
      #${PANEL_ID} .pfh-size-image-placeholder .pfh-icon {
        width: 48px;
        height: 48px;
        color: #9b86dc;
      }
      #${PANEL_ID} .pfh-size-image-placeholder strong {
        color: #4c4278;
        font-size: 14px;
      }
      #${PANEL_ID} .pfh-size-image-placeholder span:not(.pfh-icon) {
        font-size: 11px;
      }
      #${PANEL_ID} .pfh-size-image-placeholder.is-compact {
        gap: 4px;
        padding: 8px;
      }
      #${PANEL_ID} .pfh-size-image-placeholder.is-compact .pfh-icon {
        width: 28px;
        height: 28px;
      }
      #${PANEL_ID} .pfh-size-image-placeholder.is-compact strong {
        font-size: 12px;
      }
      #${PANEL_ID} .pfh-size-image-placeholder.is-compact span:not(.pfh-icon) {
        font-size: 10px;
      }
      #${PANEL_ID} .pfh-size-image-empty {
        min-height: 320px;
        display: grid;
        place-content: center;
        padding: 28px;
        text-align: center;
      }
      #${PANEL_ID} .pfh-size-image-empty strong {
        color: #30255f;
        font-size: 17px;
      }
      #${PANEL_ID} .pfh-size-image-empty p {
        max-width: 390px;
        color: #7e86a5;
        line-height: 1.7;
      }
      @container (max-width: 540px) {
        #${PANEL_ID} .pfh-size-image-scroll {
          padding: 9px;
        }
        #${PANEL_ID} .pfh-size-image-page,
        #${PANEL_ID} .pfh-size-image-workspace {
          gap: 8px;
        }
        #${PANEL_ID} .pfh-size-image-hero {
          gap: 8px;
          padding: 12px 13px;
        }
        #${PANEL_ID} .pfh-size-image-hero h3 {
          font-size: 15px;
        }
        #${PANEL_ID} .pfh-size-image-controls {
          gap: 8px;
          padding: 9px;
        }
        #${PANEL_ID} .pfh-size-image-spec {
          padding: 9px;
        }
        #${PANEL_ID} .pfh-size-image-drop {
          min-height: 112px;
          padding: 10px !important;
        }
        #${PANEL_ID} .pfh-size-image-preview,
        #${PANEL_ID} .pfh-size-image-placeholder {
          min-height: 260px;
        }
      }
      @container (max-width: 410px) {
        #${PANEL_ID} .pfh-size-image-workspace {
          grid-template-columns: 1fr;
        }
        #${PANEL_ID} .pfh-size-image-hero {
          align-items: flex-start;
          flex-direction: column;
        }
        #${PANEL_ID} .pfh-size-image-preview,
        #${PANEL_ID} .pfh-size-image-placeholder {
          min-height: 300px;
        }
      }
    `;
    document.documentElement.appendChild(style);
  }
})();
