// ==UserScript==
// @name         PLM悬浮助手
// @namespace    https://plm.westmonth.com/
// @version      2.3.144
// @description  Store PLM project packaging specs locally and show them in a floating helper.
// @author       Violet
// @match        https://plm.westmonth.com/*
// @match        https://auth.westmonth.com/*
// @require      https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js
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
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const PANEL_ID = 'plm-floating-helper';
  const LAUNCHER_ID = 'plm-floating-helper-launcher';
  const SCRIPT_VERSION = '2.3.144';
  const STORAGE_PREFIX = 'plm-floating-helper:data:';
  const STORAGE_INDEX_KEY = 'plm-floating-helper:index';
  const POSITION_KEY = 'plm-floating-helper:position';
  const LAUNCHER_POSITION_KEY = 'plm-floating-helper:launcher-position';
  const SPLIT_KEY = 'plm-floating-helper:split-width';
  const SIZE_KEY = 'plm-floating-helper:size';
  const SETTINGS_KEY = 'plm-floating-helper:settings';
  const TUTORIAL_SEEN_KEY = 'plm-floating-helper:tutorial-seen';
  const UPLOAD_QUEUE_KEY = 'plm-floating-helper:upload-queue';
  const UPLOAD_HISTORY_KEY = 'plm-floating-helper:upload-history';
  const UPLOAD_WORKER_KEY = 'plm-floating-helper:upload-worker-running';
  const LOG_KEY = 'plm-floating-helper:logs';
  const UPLOAD_DB_NAME = 'plm-floating-helper-files';
  const UPLOAD_DB_STORE = 'files';
  const UPLOAD_MAX_ZIP_BYTES = 100 * 1024 * 1024;
  const CLOUD_BACKUP_API_BASE = 'https://velvet.qzz.io';
  const CLOUD_BACKUP_API_KEY = '53xFiTF3SY4hAcuJZyIz/JR3C2fTQrZrnS96ruV2jXA=';
  const PRODUCT_REPLACE_UPLOAD_LABELS = ['\u4e3b\u56fe', '\u82f1\u6587\u53c2\u6570\u56fe', '\u8be6\u60c5\u56fe', 'SKU\u56fe', '\u89c6\u9891', '\u52a8\u56fe', '\u63a8\u54c1\u8d44\u6599', '\u56fe\u5305\u7d20\u6750'];
  const PRODUCT_BATCH_IMAGE_LABELS = ['\u4e3b\u56fe', '\u82f1\u6587\u53c2\u6570\u56fe', '\u8be6\u60c5\u56fe', 'SKU\u56fe'];
  const DETAIL_IMAGE_DOWNLOAD_CLASS = 'pfh-detail-image-download';
  const CM_TO_INCH = 1 / 2.54;
  const NORMAL_DELTA_CM = 0.2;
  const INNER_CARD_DELTA_CM = 0.5;
  const AUTO_SCAN_ATTEMPTS = 10;
  const REFRESH_SCAN_ATTEMPTS = 14;
  const SCAN_INTERVAL_MS = 650;
  const TAB_CLICK_COOLDOWN_MS = 900;
  const MATERIAL_WATCH_ATTEMPTS = 4;
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
    noPackage: '\u672a\u627e\u5230\u7eb8\u76d2/\u5370\u5237\u888b\u5c3a\u5bf8',
    noPrint: '\u672a\u627e\u5230\u6807\u7b7e/\u5370\u5237\u5c3a\u5bf8',
    noDimension: '\u65e0\u53ef\u7528\u4e09\u7ef4\u5c3a\u5bf8',
    sourceMaterial: '\u6765\u6e90\uff1a\u7269\u6599\u6e05\u5355',
    sourceOuter: '\u6765\u6e90\uff1a\u4ea7\u54c1\u4fe1\u606f\u5916\u5305\u88c5',
    updatedAt: '\u66f4\u65b0',
    pluginName: '\u63d2\u4ef6\u540d',
    version: '\u5f53\u524d\u7248\u672c',
    cachedCount: '\u5df2\u5b58\u50a8\u7f16\u7801\u6570\u91cf',
    storageNote: '\u5b58\u50a8\u4f4d\u7f6e\u8bf4\u660e',
    storageNoteText: '\u6570\u636e\u5b58\u5728 Tampermonkey/Violentmonkey \u7684\u811a\u672c\u672c\u5730\u5b58\u50a8\u4e2d\uff0c\u6e05\u7406\u6269\u5c55\u6570\u636e\u6216\u5378\u8f7d\u811a\u672c\u53ef\u80fd\u4f1a\u4e22\u5931\u3002',
    tutorialTitle: '\u4f7f\u7528\u6559\u7a0b',
    tutorialOpen: '\u91cd\u65b0\u6253\u5f00\u6559\u7a0b',
    tutorialText: '\u6587\u5b57\u7248\u8bf4\u660e',
    tutorialStart: '\u5f00\u59cb\u4f7f\u7528',
    tutorialBackSettings: '\u8fd4\u56de\u8bbe\u7f6e',
    tutorialIntro: '\u7b2c\u4e00\u6b21\u4f7f\u7528\u65f6\u5efa\u8bae\u6309\u4e0b\u9762\u6d41\u7a0b\u8d70\u4e00\u904d\uff0c\u4ee5\u540e\u5fd8\u4e86\u4e5f\u53ef\u4ee5\u5728\u8bbe\u7f6e\u91cc\u91cd\u65b0\u6253\u5f00\u3002',
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
    cloudBackupNotFound: '\u672a\u627e\u5230\u8fd9\u4e2a\u5bc6\u94a5\u7684\u4e91\u5907\u4efd',
    cloudBackupFailed: '\u4e91\u5907\u4efd\u5931\u8d25',
    cloudBackupHint: '\u586b\u5199\u540e\u4f1a\u4fdd\u5b58\u5728\u672c\u5730 PLM \u811a\u672c\u91cc\uff0c\u6bcf\u6b21\u65b0\u589e/\u66f4\u65b0\u7f16\u7801\u540e\u81ea\u52a8\u5907\u4efd\u4e00\u6b21\u3002',
    excel: '\u751f\u6210',
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
  };
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
    excel: '\u751f\u6210 Excel',
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
    seenMaterial: false,
    seenProduct: false,
    seenDesign: false,
    nextTabTarget: L.materialTab,
    lastTabClickAt: 0,
    toastTimer: 0,
    materialWatchTimer: 0,
    materialWatchAttempts: 0,
    ignoreOutsideClickUntil: 0,
    splitWidth: loadSplitWidth(),
    panelSize: loadPanelSize(),
    searchQuery: '',
    view: firstTutorial ? 'home' : 'home',
    settings: loadSettings(),
    excelPanelOpen: false,
    excelExtra: null,
    excelMissing: [],
    excelStatus: '',
    excelPackQty: '',
    excelPurchasePrice: '6',
    exportType: 'excel',
    openingProjectDetail: false,
    openingProjectDetailSku: '',
    uploadExpanded: false,
    uploadQueue: loadUploadQueue(),
    uploadHistory: loadUploadHistory(),
    uploadRunning: loadUploadWorkerRunning(),
    uploadProcessing: false,
    uploadView: 'queue',
    uploadPage: 1,
    uploadHistoryPage: 1,
    uploadSelectedIds: [],
    manuallyCollapsedForSku: '',
    userCollapsedPanel: false,
    launcherClickAt: 0,
    launcherSuppressClickUntil: 0,
    thumbHydratingSku: '',
    thumbHydrateFailedAt: {},
    thumbHydratedSkus: new Set(),
    skuPage: 1,
    cloudBackupRunning: false,
    cloudBackupQueued: false,
    cloudBackupStatus: '',
    packAiEstimatingKeys: new Set(),
    packAiFailedAt: {},
    logs: loadLogs(),
  };
  state.expanded = firstTutorial;

  if (isWestmonthLoginPage()) {
    autoClickWestmonthLogin();
    return;
  }

  injectStyle();
  ensurePanel();
  ensureLauncher();
  renderShell(L.noDrawer);
  window.addEventListener('resize', () => positionLauncher(document.getElementById(LAUNCHER_ID)));
  startDrawerWatcher();
  startUploadQueueSync();
  handleDrawerState();
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
        injectDetailImageDownloadButtons();
        positionLauncher(document.getElementById(LAUNCHER_ID));
      }, 120);
    }).observe(document.body, { childList: true, subtree: true });
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
    if (lockedSku && sku && sku !== lockedSku) return;
    if (lockedSku && !sku && state.openingProjectDetail) return;
    if (state.userCollapsedPanel && state.manuallyCollapsedForSku && state.manuallyCollapsedForSku === (sku || state.sku)) return;
    if (state.view === 'tutorial' || state.view === 'about' || state.view === 'upload') {
      state.drawer = drawer;
      state.sku = sku || state.sku || '';
      if (sku) state.selectedSku = sku;
      return;
    }
    const changed = drawer !== state.drawer || (sku && sku !== state.sku);
    if (!changed && state.manuallyCollapsedForSku && state.manuallyCollapsedForSku === (sku || state.sku)) return;
    if (!changed) return;
    state.manuallyCollapsedForSku = '';

    const cached = sku ? loadData(sku) : null;
    if (cached) {
      state.drawer = drawer;
      state.sku = sku || '';
      state.data = normalizeData(cached);
      state.selectedSku = sku;
      state.view = 'detail';
      resetExcelState();
      expandPanel();
      upsertIndex(state.data);
      stopScan();
      renderShell(L.checkingMaterial);
      if (!state.data.seenDesign || !getProductThumbUrl(state.data)) {
        resetRound(REFRESH_SCAN_ATTEMPTS);
        state.scanTargetSku = sku;
        startScan();
        return;
      }
      startMaterialWatch();
      return;
    }

    state.drawer = drawer;
    state.sku = sku || '';
    state.data = sku ? normalizeData({ sku, name: cleanName((text.match(/\u5546\u54c1\u540d\u79f0[:\uff1a]\s*([^\n]+)/) || [])[1] || '') }) : null;
    state.selectedSku = sku || '';
    state.view = 'detail';
    resetExcelState();
    resetRound(AUTO_SCAN_ATTEMPTS);
    expandPanel();
    renderShell(L.scanning);
    startScan();
  }

  function scheduleDrawerClosedCollapse() {
    const hadDrawer = Boolean(state.drawer || state.sku);
    stopScan();
    stopMaterialWatch();
    state.drawer = null;
    state.sku = '';
    if (hadDrawer) collapsePanel(true);
  }

  function resetRound(maxAttempts) {
    stopScan();
    state.scanAttempts = 0;
    state.maxAttempts = maxAttempts;
    state.scanRunning = false;
    state.scanTargetSku = '';
    state.seenMaterial = false;
    state.seenProduct = false;
    state.seenDesign = false;
    state.nextTabTarget = L.materialTab;
    state.lastTabClickAt = 0;
  }

  function startScan() {
    const drawer = getProjectDrawer();
    if (!drawer) {
      showToast('\u8bf7\u5148\u6253\u5f00\u9879\u76ee\u8be6\u60c5');
      return;
    }
    stopScan();
    state.scanRunning = true;
    scanOnce();
  }

  async function refreshSelectedData() {
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
    return normalizeData({
      sku,
      name: cached.name || '',
      brand: cached.brand || '',
      projectRowId: cached.projectRowId || '',
      projectId: cached.projectId || '',
      tailSealLengthValue: cached.tailSealLengthValue || '',
      skuImageUrl: cached.skuImageSource === 'effectImage' ? (cached.skuImageUrl || '') : '',
      skuImageFallbackUrl: cached.skuImageSource === 'effectImage' ? (cached.skuImageFallbackUrl || '') : '',
      skuImageSource: cached.skuImageSource === 'effectImage' ? 'effectImage' : '',
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
    if (!drawer || !state.data || !state.data.sku) {
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
      if (hasPackagingChanged(state.data, packaging)) {
        const packageNums = packaging.packageNums || state.data.packageNums || null;
        const hasInnerCard = hasInnerCardMark(packaging) || hasInnerCardMark(state.data);
        const productNums = productNumsFromPackage(packageNums, hasInnerCard);
        state.data = normalizeData({
          ...state.data,
          packageSizeText: packaging.packageSizeText || state.data.packageSizeText,
          packageSizeLabel: packaging.packageSizeLabel || state.data.packageSizeLabel,
          packageCode: packaging.packageCode || state.data.packageCode,
          printSizeText: packaging.printSizeText || state.data.printSizeText,
          printSizeLabel: packaging.printSizeLabel || state.data.printSizeLabel,
          printCode: packaging.printCode || state.data.printCode,
          packageNums,
          productNums,
          packageSource: packaging.packageSizeText ? L.sourceMaterial : state.data.packageSource,
          hasInnerCard,
          netContent: packaging.netContent || state.data.netContent,
          updatedAt: new Date().toLocaleString(),
          updatedAtMs: Date.now(),
        });
        saveData(state.data.sku, state.data);
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
      renderShell('\u5f53\u524d\u8be6\u60c5\u7f16\u7801\u4e0d\u5bf9\uff0c\u6b63\u5728\u91cd\u65b0\u6253\u5f00...');
      refreshSelectedData();
      return;
    }
    state.seenMaterial = state.seenMaterial || next.seenMaterial;
    state.seenProduct = state.seenProduct || next.seenProduct;
    state.seenDesign = state.seenDesign || next.seenDesign;

    if (next.sku && next.sku !== state.sku) {
      state.sku = next.sku;
      state.selectedSku = next.sku;
      state.data = loadData(next.sku);
    }

    state.data = mergeData(state.data, next);
    state.selectedSku = state.data && state.data.sku ? state.data.sku : state.selectedSku;
    renderShell(L.scanning);

    if (isRoundComplete(state.data) || state.scanAttempts >= state.maxAttempts) {
      finishRound();
      return;
    }

    clickUsefulTab(drawer);
    state.scanTimer = window.setTimeout(scanOnce, SCAN_INTERVAL_MS);
  }

  function finishRound() {
    stopScan();
    if (state.data && state.data.sku) saveData(state.data.sku, state.data);
    const shouldRefreshThumb = state.refreshingThumbSku && state.data && state.data.sku === state.refreshingThumbSku;
    if (shouldRefreshThumb) state.refreshingThumbSku = '';
    state.scanTargetSku = '';
    renderShell(L.scanDone);
    hydrateCurrentProductThumb(shouldRefreshThumb ? { force: true, refreshImage: true } : { force: true });
  }

  function isRoundComplete(data) {
    return Boolean(data && data.sku && data.name && state.seenMaterial && state.seenProduct);
  }

  function clickUsefulTab(drawer) {
    const now = Date.now();
    if (now - state.lastTabClickAt < TAB_CLICK_COOLDOWN_MS) return;

    let target = '';
    if (!state.seenMaterial && state.nextTabTarget !== L.productTab) {
      target = L.materialTab;
      state.nextTabTarget = L.productTab;
    } else if (!state.seenProduct) {
      target = L.productTab;
      state.nextTabTarget = '\u8bbe\u8ba1\u8d44\u6599';
    } else if (!state.seenDesign) {
      target = '\u8bbe\u8ba1\u8d44\u6599';
      state.nextTabTarget = L.materialTab;
    } else if (!state.seenMaterial) {
      target = L.materialTab;
      state.nextTabTarget = L.productTab;
    }

    if (!target) return;
    const tab = findTabButton(drawer, target);
    if (!tab || isActiveTab(tab)) return;
    state.lastTabClickAt = now;
    state.ignoreOutsideClickUntil = Date.now() + 1200;
    tab.click();
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

  function extractData(drawer) {
    const text = getVisibleText(drawer);
    const activeTabText = getActiveTabText(drawer);
    const seenMaterial = activeTabText === L.materialTab || /\u7269\u6599\u7f16\u7801.*\u7269\u6599\u540d\u79f0.*\u89c4\u683c\u578b\u53f7/.test(text);
    const seenProduct = activeTabText === L.productTab || /\u89c4\u683c\u4fe1\u606f[\s\S]{0,300}\u6bdb\u91cd/.test(text);
    const seenDesign = activeTabText === '\u8bbe\u8ba1\u8d44\u6599' || /\u6548\u679c\u56fe\u4fe1\u606f|\bSKU[\s(_-]*\d+.*\.(jpg|jpeg|png|webp)\b/i.test(text);
    const packaging = seenMaterial ? extractPackaging(drawer) : emptyPackaging();
    const outer = extractOuterPackage(drawer);
    const food = seenMaterial ? extractFoodSemiFinished(drawer) : emptyFoodSemiFinished();
    const imageInfo = seenDesign ? findDesignImageInfo(drawer) : { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    const packageNums = packaging.packageNums || outer.packageNums;
    const hasInnerCard = hasInnerCardMark(packaging);
    const productNums = packageNums ? productNumsFromPackage(packageNums, hasInnerCard) : food.productNums;

    return {
      sku: findSku(text),
      name: cleanName((text.match(/\u5546\u54c1\u540d\u79f0[:\uff1a]\s*([^\n]+)/) || [])[1] || ''),
      packageSizeText: packaging.packageSizeText || '',
      packageSizeLabel: packaging.packageSizeLabel || '',
      packageCode: packaging.packageCode || '',
      printSizeText: packaging.printSizeText || '',
      printSizeLabel: packaging.printSizeLabel || '',
      printCode: packaging.printCode || '',
      packageNums,
      productNums,
      packageSource: packaging.packageSizeText || food.productNums ? L.sourceMaterial : (outer.packageNums ? L.sourceOuter : ''),
      hasInnerCard,
      brand: getProjectField(text, '\u54c1\u724c') || getFormValueByLabel('\u54c1\u724c', drawer),
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
    if (next.seenDesign) {
      merged.skuImageUrl = next.skuImageUrl || '';
      merged.skuImageFallbackUrl = next.skuImageFallbackUrl || '';
      merged.skuImageSource = next.skuImageSource || '';
    }
    merged.seenMaterial = previous.seenMaterial || next.seenMaterial;
    merged.seenProduct = previous.seenProduct || next.seenProduct;
    merged.seenDesign = previous.seenDesign || next.seenDesign;
    return normalizeData(merged);
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
    return {
      ...safe,
      hasInnerCard,
      isTubePrint,
      isTubePrintMaterial: Boolean(safe.isTubePrintMaterial),
      packageNums,
      productNums,
      packageLength: formatDimensionPart(packageNums, 0),
      packageWidth: formatDimensionPart(packageNums, 1),
      packageHeight: formatDimensionPart(packageNums, 2),
      tailSealLengthValue: isTubePrint ? (safe.tailSealLengthValue || '') : '',
      productLength: isTubePrint ? (safe.tailSealLengthValue || '') : formatDimensionPart(productNums, 0),
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
    const stop = /(\u9879\u76ee\u7f16\u7801|\u9700\u6c42\u7f16\u7801|\u5546\u54c1\u540d\u79f0|\u5546\u54c1\u7f16\u7801|\u7f8e\u5de5\u5904\u7406\u4f18\u5148\u7ea7|\u5f00\u53d1\u5206\u914d\u65f6\u95f4|\u8bbe\u8ba1\u5206\u914d\u65f6\u95f4|\u521b\u5efa\u65f6\u95f4|\u6700\u540e\u4fee\u6539\u65f6\u95f4|\u9879\u76ee\u4fe1\u606f|\u7269\u6599\u6e05\u5355|\u4ea7\u54c1\u4fe1\u606f)/;
    const match = String(text || '').match(new RegExp(escaped + '[:\uff1a]\\s*([\\s\\S]{0,80})'));
    if (!match) return '';
    return compactText(match[1]).split(stop)[0].trim();
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
    if (Boolean(data.isTubePrintMaterial) || isTubePrintRow(text)) return true;
    const printNums = parseDimension(data.printSizeText, 2);
    const labelLooksGenericPrint = /^\s*(?:\u5370\u5237|\u5370\u5237\u5c3a\u5bf8)?\s*$/.test(String(data.printSizeLabel || ''));
    return labelLooksGenericPrint && Array.isArray(printNums) && printNums.length === 2 && Array.isArray(packageNums) && packageNums.length >= 3;
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
    const pcsMatch = String(row || '').match(/(\d+(?:\.\d+)?)\s*PCS\s*(?:\/\s*\u76d2)?/i);
    if (pcsMatch) return trimNumber(Number(pcsMatch[1])) + 'PCS';
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
    if (/^\d+(?:\.\d+)?\s*(CAPSULES|GUMMIES|TABLETS|PAIR|PAIRS|PCS)$/i.test(text)) return text.replace(/\s+/g, '').toUpperCase();
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
    const cm = trimNumber(nums[index]);
    const inch = trimNumber(nums[index] * CM_TO_INCH);
    return cm + 'cm/' + inch + 'inch';
  }

  function getFormValueByLabel(fieldLabel, root) {
    const labels = Array.from(root.querySelectorAll('label, .ant-form-item-label, .ant-descriptions-item-label, [class*="label"], [class*="Label"]'))
      .filter(isVisibleElement)
      .filter((el) => compactLabel(el.textContent) === fieldLabel);
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
    panel.innerHTML = '<div class="pfh-full"><div class="pfh-header"><div class="pfh-heading"><strong></strong><div class="pfh-search"><span class="pfh-search-box"><input type="search" class="pfh-search-input" autocomplete="off" autocapitalize="off" spellcheck="false" data-lpignore="true"><button type="button" class="pfh-search-clear" data-action="clear-search"></button></span><button type="button" data-action="search"></button></div></div><div class="pfh-actions"><button type="button" data-action="about"></button><button type="button" data-action="open-detail"></button><button type="button" data-action="upload-toggle"></button><button type="button" data-action="collapse"></button></div></div><div class="pfh-main"><aside class="pfh-list"></aside><div class="pfh-splitter" title="\u62d6\u52a8\u8c03\u6574\u5de6\u53f3\u5bbd\u5ea6"></div><div class="pfh-detail"></div></div><input type="file" class="pfh-import-file" accept="application/json,.json"><div class="pfh-resize-handle pfh-resize-n" data-resize-dir="n"></div><div class="pfh-resize-handle pfh-resize-e" data-resize-dir="e"></div><div class="pfh-resize-handle pfh-resize-s" data-resize-dir="s"></div><div class="pfh-resize-handle pfh-resize-w" data-resize-dir="w"></div><div class="pfh-resize-handle pfh-resize-ne" data-resize-dir="ne"></div><div class="pfh-resize-handle pfh-resize-nw" data-resize-dir="nw"></div><div class="pfh-resize-handle pfh-resize-se" data-resize-dir="se" title="\u62d6\u52a8\u8c03\u6574\u7a97\u53e3\u5927\u5c0f"></div><div class="pfh-resize-handle pfh-resize-sw" data-resize-dir="sw"></div></div>';
    document.documentElement.appendChild(panel);
    panel.querySelector('strong').textContent = L.title;
    panel.querySelector('.pfh-search-input').placeholder = L.searchPlaceholder;
    panel.querySelector('.pfh-search-clear').textContent = '\u00d7';
    panel.querySelector('.pfh-search-clear').title = L.clearSearch;
    panel.querySelector('[data-action="search"]').innerHTML = '<span class="pfh-btn-text">' + escapeHtml(L.search) + '</span>';
    panel.querySelector('[data-action="search"]').title = TOOLTIP.search;
    panel.querySelector('[data-action="about"]').innerHTML = iconHtml('settings') + '<span>\u8bbe\u7f6e</span>';
    panel.querySelector('[data-action="about"]').title = TOOLTIP.about;
    panel.querySelector('[data-action="open-detail"]').innerHTML = iconHtml('folder') + '<span>\u6253\u5f00\u8be6\u60c5</span>';
    panel.querySelector('[data-action="open-detail"]').title = TOOLTIP.openDetail;
    panel.querySelector('[data-action="collapse"]').setAttribute('data-action', 'panel-close');
    panel.querySelector('[data-action="upload-toggle"]').innerHTML = iconHtml('upload') + '<span>\u63d0\u5ba1\u4e0a\u4f20</span>';
    panel.querySelector('[data-action="upload-toggle"]').title = L.uploadSection;
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
      download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10"></path><path d="m8 10 4 4 4-4"></path><path d="M5 20h14"></path></svg>',
      box: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8h10v12H7z"></path><path d="M9 8V5h6v3"></path></svg>',
      tag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11 11 4h7v7l-7 7-7-7Z"></path><circle cx="15.5" cy="7.5" r="1"></circle></svg>',
      list: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h10v14H7z"></path><path d="M9 8h6M9 12h6M9 16h4"></path></svg>',
      print: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V4h10v4"></path><path d="M7 17H5V9h14v8h-2"></path><path d="M7 14h10v6H7z"></path></svg>',
      bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9h10l1 11H6L7 9Z"></path><path d="M9 9a3 3 0 0 1 6 0"></path></svg>',
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
    panel.classList.remove('is-collapsed');
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
    panel.style.display = 'none';
    panel.classList.add('is-collapsed');
    ensureLauncher();
    renderShell(L.noDrawer);
  }

  function isPanelVisible() {
    const panel = document.getElementById(PANEL_ID);
    return Boolean(panel && panel.style.display !== 'none' && !panel.classList.contains('is-collapsed'));
  }

  function updatePanelPinButton(panel) {
    const button = panel && panel.querySelector('[data-action="panel-close"]');
    if (!button) return;
    button.innerHTML = iconHtml('close') + '<span>' + escapeHtml(L.close) + '</span>';
    button.title = TOOLTIP.collapse;
  }

  function updateSettingsNotice(panel) {
    const button = panel && panel.querySelector('[data-action="about"]');
    if (!button) return;
    button.classList.toggle('has-notice', !state.settings.backgroundNoticeSeen);
  }

  function renderShell(statusText) {
    const panel = ensurePanel();
    panel.dataset.view = state.view || 'home';
    const main = panel.querySelector('.pfh-main');
    if (main) main.classList.toggle('is-home', state.view === 'home');
    const scrollSnapshot = capturePanelScroll(panel);
    updatePanelPinButton(panel);
    updateSettingsNotice(panel);
    renderUploadProgressOverlay(panel);
    if (state.view === 'home') {
      renderHome(panel, statusText);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'tutorial') renderTutorialList(panel);
    else if (state.view === 'upload') renderUploadSidebar(panel);
    else renderSkuList(panel);
    if (state.view === 'about') {
      renderAbout(panel);
      updateSettingsNotice(panel);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'tutorial') {
      renderTutorial(panel);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'upload') {
      renderUpload(panel);
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
    const selectors = ['.pfh-sku-scroll', '.pfh-detail-scroll', '.pfh-upload-list'];
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

  function renderTutorialList(panel) {
    const list = panel.querySelector('.pfh-list');
    list.innerHTML = '<div class="pfh-list-head"><strong>' + escapeHtml(L.tutorialTitle) + '</strong></div>' +
      '<div class="pfh-sku-scroll pfh-tutorial-nav">' +
      ['\u6253\u5f00\u8be6\u60c5', '\u81ea\u52a8\u8bc6\u522b', '\u590d\u5236/\u5237\u65b0', '\u751f\u6210 Excel', '\u63d0\u5ba1\u4e0a\u4f20', '\u540e\u53f0\u81ea\u52a8\u5316', '\u7f13\u5b58\u5907\u4efd'].map((text, index) =>
        '<div class="pfh-tutorial-nav-item"><b>' + (index + 1) + '</b><span>' + escapeHtml(text) + '</span></div>'
      ).join('') +
      '</div><div class="pfh-list-pager"><span>\u5171 7 \u6b65</span><div><button type="button" disabled>\u2039</button><b>1</b><button type="button" disabled>\u203a</button></div></div>';
  }

  function renderAbout(panel) {
    const detail = panel.querySelector('.pfh-detail');
    detail.innerHTML = [
      '<div class="pfh-detail-scroll"><section class="pfh-section pfh-about-section"><h3>' + escapeHtml(L.settingsTitle) + '</h3>',
      rowHtml('aboutPluginName', L.pluginName, L.title, { noCopy: true }),
      rowHtml('aboutVersion', L.version, 'v' + SCRIPT_VERSION, { noCopy: true }),
      rowHtml('aboutCachedCount', L.cachedCount, String(state.index.length), { noCopy: true }),
      '<div class="pfh-setting-row"><span>' + escapeHtml(L.excelKeywordSetting) + '</span><label><input type="radio" name="pfh-keyword-mode" value="brandName"' + (state.settings.excelKeywordMode === 'brandName' ? ' checked' : '') + '> ' + escapeHtml(L.excelKeywordBrandName) + '</label><label><input type="radio" name="pfh-keyword-mode" value="english"' + (state.settings.excelKeywordMode === 'english' ? ' checked' : '') + '> ' + escapeHtml(L.excelKeywordEnglish) + '</label></div>',
      '<div class="pfh-setting-row"><span>' + escapeHtml(L.excelDownloadSetting) + '</span><label><input type="radio" name="pfh-download-mode" value="picker"' + (state.settings.excelDownloadMode === 'picker' ? ' checked' : '') + '> ' + escapeHtml(L.excelDownloadPicker) + '</label><label><input type="radio" name="pfh-download-mode" value="direct"' + (state.settings.excelDownloadMode === 'direct' ? ' checked' : '') + '> ' + escapeHtml(L.excelDownloadDirect) + '</label></div>',
      '<div class="pfh-cloud-backup"><h4>' + escapeHtml(L.cloudBackupTitle) + '</h4><label class="pfh-cloud-key"><span>' + escapeHtml(L.cloudBackupKey) + '</span><input type="text" class="pfh-cloud-backup-key" value="' + escapeHtml(state.settings.cloudBackupKey || '') + '" placeholder="' + escapeHtml(L.cloudBackupPlaceholder) + '" autocomplete="off" autocapitalize="off" spellcheck="false" data-lpignore="true"></label><p>' + escapeHtml(L.cloudBackupHint) + '</p><div class="pfh-about-actions"><button type="button" data-action="cloud-backup-save">' + escapeHtml(L.cloudBackupSave) + '</button><button type="button" data-action="cloud-backup-restore">' + escapeHtml(L.cloudBackupRestore) + '</button><span class="pfh-cloud-status">' + escapeHtml(getCloudBackupStatusText()) + '</span></div></div>',
      '<div class="pfh-about-note pfh-warning-note">' + iconHtml('warning') + '<div><strong>' + escapeHtml(L.backgroundAutomationTitle) + '</strong><p>' + escapeHtml(L.backgroundAutomationText) + '</p></div></div>',
      '<div class="pfh-easter-egg">' + escapeHtml(L.easterEgg) + '</div>',
      '<div class="pfh-about-note"><strong>' + escapeHtml(L.storageNote) + '</strong><p>' + escapeHtml(L.storageNoteText) + '</p></div>',
      '<div class="pfh-about-note pfh-manual-note"><strong>' + escapeHtml(L.tutorialText) + '</strong><p>' + escapeHtml(getTutorialPlainText()) + '</p></div>',
      '<div class="pfh-about-actions"><button type="button" data-action="export-cache">' + escapeHtml(L.exportCache) + '</button><button type="button" data-action="import-cache">' + escapeHtml(L.importCache) + '</button></div>',
      '<div class="pfh-about-actions"><button type="button" data-action="tutorial-open">' + escapeHtml(L.tutorialOpen) + '</button></div>',
      renderLogSection(),
      '</section></div>',
    ].join('');
  }

  function renderLogSection() {
    const logs = (state.logs || []).slice(0, 80);
    const rows = logs.length ? logs.map((item) => {
      const level = item.level || 'info';
      return '<div class="pfh-log-row is-' + escapeHtml(level) + '"><span>' + escapeHtml(item.time || '') + '</span><b>' + escapeHtml(level.toUpperCase()) + '</b><p>' + escapeHtml(item.message || '') + '</p></div>';
    }).join('') : '<div class="pfh-empty">' + escapeHtml(L.logEmpty) + '</div>';
    return '<div class="pfh-log-panel"><div class="pfh-log-head"><strong>' + escapeHtml(L.logTitle) + '</strong><span>' + escapeHtml(String((state.logs || []).length)) + '</span></div><div class="pfh-about-actions"><button type="button" data-action="copy-logs">' + escapeHtml(L.logCopy) + '</button><button type="button" data-action="clear-logs">' + escapeHtml(L.logClear) + '</button></div><div class="pfh-log-list">' + rows + '</div></div>';
  }

  function renderTutorial(panel) {
    const detail = panel.querySelector('.pfh-detail');
    detail.classList.remove('is-loading');
    const steps = [
      ['1', '\u6253\u5f00\u4ea7\u54c1\u8be6\u60c5', '\u5728 PLM \u9879\u76ee\u6216\u5546\u54c1\u5217\u8868\u91cc\u70b9\u51fb\u201c\u8be6\u60c5\u201d\u3002\u60ac\u6d6e\u52a9\u624b\u4f1a\u81ea\u52a8\u5c55\u5f00\uff0c\u5148\u663e\u793a SKU\uff0c\u6709\u7f13\u5b58\u5c31\u76f4\u63a5\u8bfb\u7f13\u5b58\u3002'],
      ['2', '\u7b49\u5f85\u81ea\u52a8\u8bc6\u522b', '\u9996\u6b21\u6ca1\u7f13\u5b58\u65f6\uff0c\u811a\u672c\u4f1a\u81ea\u52a8\u8bfb\u7269\u6599\u6e05\u5355\u548c\u4ea7\u54c1\u4fe1\u606f\uff1a\u7eb8\u76d2/\u5370\u5237\u888b\u5c3a\u5bf8\u3001\u6807\u7b7e/\u5370\u5237\u5c3a\u5bf8\u3001\u51c0\u542b\u91cf\u3001\u6bdb\u91cd\u90fd\u4f1a\u6536\u96c6\u5230\u56fe\u5305\u4fe1\u606f\u91cc\u3002'],
      ['3', '\u590d\u5236\u548c\u5237\u65b0', '\u6bcf\u4e00\u884c\u53f3\u4fa7\u7684\u526a\u5200\u6309\u94ae\u53ef\u4ee5\u590d\u5236\u5bf9\u5e94\u6570\u636e\u3002\u5982\u679c\u9875\u9762\u8fd8\u6ca1\u52a0\u8f7d\u5b8c\u6216\u8bc6\u522b\u4e0d\u51c6\uff0c\u70b9\u53f3\u4e0b\u89d2\u5237\u65b0\u6309\u94ae\u91cd\u65b0\u8bc6\u522b\u4e00\u6b21\u3002'],
      ['4', '\u751f\u6210 Excel', '\u5728\u201c\u56fe\u5305\u4fe1\u606f\u201d\u6807\u9898\u53f3\u4fa7\u70b9\u201c\u5bfc\u51fa Excel\u201d\uff0c\u5148\u586b\u88c5\u7bb1\u6570\u548c\u91c7\u8d2d\u4ef7\u683c\uff0c\u70b9\u91cd\u65b0\u83b7\u53d6\u786e\u8ba4\u7eff\u706f\u540e\u518d\u70b9\u751f\u6210\u3002\u7ea2\u706f\u4e5f\u53ef\u751f\u6210\uff0c\u7f3a\u5931\u7684\u683c\u5b50\u4f1a\u7559\u7a7a\u3002'],
      ['5', '\u63d0\u5ba1\u4e0a\u4f20', '\u70b9\u9876\u90e8\u201c\u63d0\u5ba1\u4e0a\u4f20\u201d\uff0c\u628a xlsx \u548c zip \u62d6\u8fdb\u6765\u3002\u6587\u4ef6\u540d\u91cc\u7684 SKU \u4f1a\u81ea\u52a8\u5165\u961f\uff0c\u540c\u4e00 SKU \u7684 xlsx \u548c zip \u90fd\u9f50\u624d\u4f1a\u4e0a\u4f20\u3002\u5b8c\u6210\u7684\u4f1a\u8fdb\u5386\u53f2\u8bb0\u5f55\uff0c\u7f3a\u6587\u4ef6\u6216\u4e0d\u80fd\u7f16\u8f91\u4f1a\u7ea2\u706f\u8df3\u8fc7\u3002'],
      ['6', L.backgroundAutomationTitle, L.backgroundAutomationText],
      ['7', '\u65e5\u5e38\u5c0f\u6280\u5de7', '\u5de6\u4fa7 SKU \u5217\u8868\u53ef\u641c\u7d22\u4ea7\u54c1\u540d\u3001SKU\u3001\u7eb8\u76d2/\u6807\u7b7e\u7f16\u7801\u3002\u9009\u4e2d SKU \u540e\u53ef\u7f6e\u9876\uff0c\u5e38\u7528\u4ea7\u54c1\u4f1a\u6392\u5728\u524d\u9762\u3002\u8bbe\u7f6e\u91cc\u53ef\u5bfc\u51fa/\u5bfc\u5165\u7f13\u5b58\uff0c\u5206\u4eab\u524d\u53ef\u5148\u5907\u4efd\u3002'],
    ];
    detail.innerHTML = [
      '<div class="pfh-detail-scroll"><section class="pfh-section pfh-tutorial-section">',
      '<div class="pfh-tutorial-hero"><h3>' + escapeHtml(L.tutorialTitle) + '</h3><p>' + escapeHtml(L.tutorialIntro) + '</p></div>',
      '<div class="pfh-tutorial-steps">' + steps.map((step) => '<article><b>' + escapeHtml(step[0]) + '</b><div><strong>' + escapeHtml(step[1]) + '</strong><p>' + escapeHtml(step[2]) + '</p></div></article>').join('') + '</div>',
      '<div class="pfh-about-note pfh-manual-note"><strong>' + escapeHtml(L.tutorialText) + '</strong><p>' + escapeHtml(getTutorialPlainText()) + '</p></div>',
      '<div class="pfh-about-actions pfh-tutorial-actions"><button type="button" data-action="tutorial-done">' + escapeHtml(L.tutorialStart) + '</button><button type="button" data-action="tutorial-back-settings">' + escapeHtml(L.tutorialBackSettings) + '</button></div>',
      '</section></div>',
    ].join('');
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
      '<button type="button" class="pfh-upload-side-card" data-action="upload-history-toggle">' + iconHtml('list') + '<strong>' + escapeHtml(historyLabel) + '</strong><span>' + escapeHtml(state.uploadView === 'history' ? '\u8fd4\u56de\u5f85\u4e0a\u4f20\u961f\u5217' : '\u67e5\u770b\u5df2\u5b8c\u6210\u548c\u5f02\u5e38\u8bb0\u5f55') + '</span></button>' +
      '<button type="button" class="pfh-upload-side-card" data-action="upload-clear-list">' + iconHtml('close') + '<strong>' + escapeHtml(L.uploadClearList) + '</strong><span>' + escapeHtml('\u6e05\u7406\u5f53\u524d\u5217\u8868\u9879') + '</span></button>' +
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
    const listHead = '<div class="pfh-list-head"><button type="button" data-action="home-back" title="\u8fd4\u56de\u4e3b\u9875">' + iconHtml('back') + '</button><strong>SKU\u5217\u8868</strong><span>\u5171 ' + allItems.length + ' \u6761</span></div>';
    const pager = '<div class="pfh-list-pager"><div><button type="button" data-action="sku-page-prev"' + (state.skuPage <= 1 ? ' disabled' : '') + '>\u2039</button>' + renderCompactPager('sku-page', state.skuPage, totalPages) + '<button type="button" data-action="sku-page-next"' + (state.skuPage >= totalPages ? ' disabled' : '') + '>\u203a</button></div></div>';
    if (!allItems.length) {
      list.innerHTML = listHead + '<div class="pfh-sku-scroll"><div class="pfh-empty">' + escapeHtml(searchTokens.length ? L.noSearchResult : L.emptyList) + '</div></div>' + pager;
      return;
    }
    list.innerHTML = listHead + '<div class="pfh-sku-scroll">' + (searchTokens.length ? '<div class="pfh-list-note">' + escapeHtml(L.searchResult + ': ' + allItems.length) + '</div>' : '') + items.map((item) => {
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

  function renderDetail(panel, statusText) {
    const detail = panel.querySelector('.pfh-detail');
    const data = state.data || (state.selectedSku ? loadData(state.selectedSku) : null);
    detail.classList.toggle('is-loading', statusText === L.scanning);
    if (!data) {
      detail.innerHTML = homeViewHtml(statusText, null);
      return;
    }
    state.data = normalizeData(data);
    scheduleProductThumbHydration(state.data);
    const main = panel.querySelector('.pfh-main');
    if (main) main.classList.remove('is-home');
    detail.innerHTML = [
      '<div class="pfh-detail-scroll">',
      '<section class="pfh-section pfh-file-section"><div class="pfh-product-hero"><div class="pfh-title-meta" title="' + escapeHtml(L.copyHint) + '">' +
        productThumbHtml(state.data) +
        '<div class="pfh-product-title-copy"><span data-action="copy-sku">' + escapeHtml(state.data.sku || L.sku) + '</span><strong data-action="copy-title-meta">' + escapeHtml([state.data.brand, state.data.name].filter(Boolean).join(' ') || formatTitleMeta(state.data) || L.noDrawer) + '</strong></div>' +
      '</div></div>',
      '<div class="pfh-info-grid">',
      rowHtml('packageCode', L.packageCode, state.data.packageCode),
      rowHtml('printCode', L.printCode, state.data.printCode),
      rowHtml('packageSizeText', state.data.packageSizeLabel || L.packageSize, state.data.packageSizeText || L.noPackage),
      rowHtml('printSizeText', state.data.printSizeLabel || L.printSize, state.data.printSizeText || L.noPrint),
      '</div>',
      '</section>',
      '<section class="pfh-section"><div class="pfh-section-title pfh-graphic-title"><h3>' + escapeHtml(L.graphicSection) + '</h3>' + excelControlsHtml() + '</div>',
      '<div class="pfh-graphic-table pfh-info-grid">',
      rowHtml('packageLength', L.cartonLength, state.data.packageLength || L.noDimension),
      rowHtml('productLength', L.productLength, state.data.isTubePrint ? (state.data.productLength || L.tailSealLength) : (state.data.productLength || L.noDimension), { editable: state.data.isTubePrint }),
      rowHtml('packageWidth', L.cartonWidth, state.data.packageWidth || L.noDimension),
      rowHtml('productWidth', L.productWidth, state.data.productWidth || L.noDimension),
      rowHtml('packageHeight', L.cartonHeight, state.data.packageHeight || L.noDimension),
      rowHtml('productHeight', L.productHeight, state.data.productHeight || L.noDimension),
      rowHtml('netContent', L.netContent, state.data.netContent || L.unknown),
      rowHtml('grossWeight', L.grossWeight, state.data.grossWeight || L.unknown),
      '</div></section>',
      statusText ? '<div class="pfh-status">' + escapeHtml(statusText) + '</div>' : '',
      '</div>',
      '<div class="pfh-note"><span class="pfh-note-source">' + escapeHtml(state.data.updatedAt ? (L.updatedAt + ': ' + state.data.updatedAt) : '') + '</span><span class="pfh-note-toast" aria-live="polite"></span><button type="button" data-action="refresh" title="' + escapeHtml(TOOLTIP.refresh) + '">' + iconHtml('refresh') + '</button></div>',
    ].join('');
  }

  function homeViewHtml(statusText) {
    const count = state.index.length;
    const status = statusText || '打开项目后，我会自动沉淀尺寸、净含量、重量与图包信息。';
    const cards = [
      ['open-first-detail', 'folder', '我的详情', '打开我的详情', '默认打开第一个编码的详情页。'],
      ['home-excel-coming-soon', 'download', '规格成表', '批量生成 Excel', '把纸盒、标签、净含量与图片整理成可交付表格。'],
      ['upload-toggle', 'upload', '提审流转', '批量提审上传', '按 SKU 队列上传文件，记录成功、草稿与异常状态。'],
      ['home-download-detail', 'list', '图像归档', '批量下载详情图', '按主图/详情图分组处理下载流程，减少重复点击。'],
    ];
    return '<div class="pfh-detail-scroll"><section class="pfh-home">' +
      '<div class="pfh-home-orbit"><i class="wave"></i><i class="wave"></i><i class="wave"></i><span></span></div>' +
      '<h2>PLM 工作台</h2>' +
      '<p>' + escapeHtml(status) + '</p>' +
      '<div class="pfh-home-stats"><span>CACHED</span><b>' + escapeHtml(String(count)) + '</b><em>本地产品档案</em></div>' +
      '<div class="pfh-home-grid">' + cards.map((card) => '<button type="button" class="pfh-home-card" data-action="' + card[0] + '">' +
        iconHtml(card[1]) +
        '<small>' + escapeHtml(card[2]) + '</small>' +
        '<strong>' + escapeHtml(card[3]) + '</strong>' +
        '<span>' + escapeHtml(card[4]) + '</span>' +
      '</button>').join('') + '</div>' +
      '</section></div>';
  }

  function productThumbHtml(data) {
    const src = getProductThumbUrl(data);
    if (!src) return '<span class="pfh-product-thumb is-empty">' + iconHtml('box') + '</span>';
    return '<button type="button" class="pfh-product-thumb" title="悬浮放大预览">' +
      '<span class="pfh-thumb-frame"><img src="' + escapeHtml(src) + '" alt=""></span>' +
      '<span class="pfh-thumb-preview"><img src="' + escapeHtml(src) + '" alt=""></span>' +
      '</button>';
  }

  function getProductThumbUrl(data) {
    if (!data) return '';
    return data.skuImageSource === 'effectImage' ? (data.skuImageUrl || data.skuImageFallbackUrl || '') : '';
  }

  function scheduleProductThumbHydration(data, options) {
    const opts = options || {};
    const sku = data && data.sku;
    if (!sku || (!opts.refreshImage && getProductThumbUrl(data)) || state.thumbHydratingSku === sku || (!opts.force && state.thumbHydratedSkus.has(sku))) return;
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
    const drawer = getProjectDrawerForSku(sku);
    if (!drawer) {
      state.thumbHydrateFailedAt[sku] = Date.now();
      return;
    }
    const imageInfo = await collectProductImageInfo(drawer, {
      sku,
      includeBenchmark: false,
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
    const current = normalizeData(loadData(sku) || state.data || { sku });
    cacheProductThumb(current, { skuImageUrl: src, skuImageFallbackUrl: imageInfo.imageFallbackUrl || src, isSkuDesignImage: true });
    if (state.thumbHydrateFailedAt) delete state.thumbHydrateFailedAt[sku];
    state.thumbHydratedSkus.add(sku);
    if (state.data && state.data.sku === sku) renderShell();
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
      '<span class="pfh-value">' + escapeHtml(shown) + '</span>' +
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

  function excelControlsHtml() {
    if (!state.excelPanelOpen) {
      return '<div class="pfh-excel-controls"><button type="button" data-action="excel-prepare">' + iconHtml('download') + '<span>\u5bfc\u51fa Excel</span></button></div>';
    }
    const status = state.excelStatus || (state.excelMissing.length ? L.excelIncomplete : L.excelReady);
    const statusClass = state.excelMissing.length || !state.excelExtra ? ' is-bad' : ' is-good';
    const priceValue = state.excelPurchasePrice === '' ? '6' : state.excelPurchasePrice;
    return '<div class="pfh-excel-controls is-open">' +
      '<select class="pfh-export-type" title="' + escapeHtml(L.action) + '">' +
        '<option value="excel"' + (state.exportType === 'excel' ? ' selected' : '') + '>' + escapeHtml(L.exportTypeExcel) + '</option>' +
        '<option value="toy-label"' + (state.exportType === 'toy-label' ? ' selected' : '') + '>' + escapeHtml(L.exportTypeToyLabel) + '</option>' +
      '</select>' +
      '<input type="number" min="0" step="1" class="pfh-excel-pack" placeholder="' + escapeHtml(L.excelPackQty) + '" value="' + escapeHtml(state.excelPackQty) + '">' +
      '<input type="number" min="0" step="1" class="pfh-excel-price" placeholder="' + escapeHtml(L.excelPurchasePrice) + '" value="' + escapeHtml(priceValue) + '">' +
      '<button type="button" data-action="excel-prepare" title="' + escapeHtml(L.excelRefresh) + '">' + iconHtml('refresh') + '</button>' +
      '<button type="button" data-action="excel-generate">' + escapeHtml(state.exportType === 'toy-label' ? L.excel : L.excel) + '</button>' +
      '<span class="pfh-excel-status' + statusClass + '">' + escapeHtml(status) + '</span>' +
      '</div>';
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
      const ready = Boolean(item.xlsxKey && item.zipKey);
      const status = viewingHistory ? (item.status || L.uploadSuccess) : (ready ? (item.status || '\u5f85\u4e0a\u4f20') : '\u7f3a\u6587\u4ef6');
      const statusClass = /\u6210\u529f/.test(status) ? 'is-success' : (!ready || /\u5931\u8d25|\u8df3\u8fc7|\u5df2\u6709\u5185\u5bb9/.test(status) ? 'is-missing' : 'is-ready');
      const files = [
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
    return '<div class="pfh-detail-scroll pfh-upload-scroll"><section class="pfh-section pfh-upload-section is-open">' +
      '<div class="pfh-section-title pfh-upload-title"><h3>' + escapeHtml(L.uploadSection) + '</h3>' +
      '<span class="pfh-upload-status">' + escapeHtml(statusText) + '</span>' +
      '<button type="button" data-action="upload-toggle">' + escapeHtml('\u6536\u8d77') + '</button></div>' +
      '<div class="pfh-upload-body">' +
        (viewingHistory ? '' : '<div class="pfh-upload-drop" data-upload-drop="any">' + escapeHtml(L.uploadDropHint) + '</div>' +
        '<input class="pfh-upload-file" data-upload-kind="any" type="file" multiple accept=".xls,.xlsx,.zip,.rar">' +
        '<div class="pfh-upload-actions"><button type="button" data-action="upload-pick" data-upload-kind="any">\u9009\u62e9\u6587\u4ef6</button>' + (state.uploadRunning ? '<button type="button" data-action="upload-pause">' + escapeHtml(L.uploadPauseQueue) + '</button>' : '<button type="button" data-action="upload-start">' + escapeHtml(L.uploadStartQueue) + '</button>') + '</div>') +
        tableHead + '<div class="pfh-upload-list">' + rows + '</div>' +
      '</div>' +
      '</section></div>' +
      '<div class="pfh-upload-bottom">' + '<div class="pfh-upload-bottom-line">' + pager + selectedActionHtml + '</div>' + '<div class="pfh-note"><span class="pfh-note-source">' + escapeHtml('\u53ea\u6709\u540c\u4e00 SKU \u7684 xlsx \u548c zip \u90fd\u9f50\u5168\u624d\u4f1a\u4e0a\u4f20\uff1b\u7f3a\u6587\u4ef6\u7684\u9879\u4f1a\u7ea2\u706f\u8df3\u8fc7\u3002') + '</span><span class="pfh-note-toast" aria-live="polite"></span></div></div>';
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
    if (action === 'expand') {
      expandPanel();
      return;
    }
    if (action === 'panel-close') {
      collapsePanel(true);
      return;
    }
    if (action === 'refresh') {
      refreshSelectedData();
      return;
    }
    if (action === 'search') {
      state.view = 'detail';
      state.skuPage = 1;
      runSearch();
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
    if (action === 'about') {
      if (!state.settings.backgroundNoticeSeen) {
        state.settings.backgroundNoticeSeen = true;
        saveSettings(state.settings);
      }
      state.view = state.view === 'about' ? 'detail' : 'about';
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'tutorial-open') {
      state.view = 'tutorial';
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'tutorial-done') {
      saveTutorialSeen(true);
      state.view = state.data ? 'detail' : 'about';
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'tutorial-back-settings') {
      saveTutorialSeen(true);
      state.view = 'about';
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'open-detail') {
      openSelectedProjectDetail();
      return;
    }
    if (action === 'open-first-detail') {
      openFirstCachedDetail();
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
    if (action === 'upload-toggle') {
      state.view = state.view === 'upload' ? 'detail' : 'upload';
      state.uploadExpanded = true;
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'home-download-detail') {
      runHomeDetailImageDownload();
      return;
    }
    if (action === 'home-excel-coming-soon') {
      showToast('\u656c\u8bf7\u671f\u5f85');
      return;
    }
    if (action === 'home-back') {
      state.view = 'home';
      state.uploadExpanded = false;
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
      const shouldPromote = Boolean(state.searchQuery.trim());
      state.selectedSku = sku;
      state.data = data ? normalizeData(data) : null;
      state.searchQuery = '';
      state.view = 'detail';
      resetExcelState();
      const input = ensurePanel().querySelector('.pfh-search-input');
      if (input) input.value = '';
      updateSearchClear();
      if (shouldPromote) promoteIndexItem(sku);
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
      copyText((state.data && state.data[key]) || (key === 'productLength' && state.data && state.data.isTubePrint ? L.tailSealLength : ''));
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
    if (event.target && event.target.classList && event.target.classList.contains('pfh-search-input')) {
      event.target.value = normalizeSearchInput(event.target.value);
      updateSearchClear();
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-excel-pack')) {
      state.excelPackQty = event.target.value;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-excel-price')) {
      state.excelPurchasePrice = event.target.value;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-cloud-backup-key')) {
      state.settings.cloudBackupKey = event.target.value.trim();
      saveSettings(state.settings);
    }
  }

  function handlePanelPaste(event) {
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

  function handlePanelChange(event) {
    if (event.target && event.target.classList && event.target.classList.contains('pfh-export-type')) {
      state.exportType = event.target.value === 'toy-label' ? 'toy-label' : 'excel';
      renderShell();
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-upload-file')) {
      const files = Array.from(event.target.files || []);
      files.forEach((file) => storeQueuedUploadFile(file));
      event.target.value = '';
    }
  }

  function handlePanelDragOver(event) {
    if (event.target && event.target.closest && event.target.closest('.pfh-upload-section')) {
      event.preventDefault();
    }
  }

  function handlePanelDrop(event) {
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

  async function processUploadQueue() {
    state.uploadRunning = loadUploadWorkerRunning();
    state.uploadQueue = loadUploadQueue();
    if (!state.uploadRunning || state.uploadProcessing) return;
    state.uploadProcessing = true;
    try {
      while (state.uploadRunning) {
        if (await recoverPurchaseEmptyRunningUpload()) {
          state.uploadRunning = loadUploadWorkerRunning();
          state.uploadQueue = loadUploadQueue();
          continue;
        }
        const item = state.uploadQueue.find((entry) => entry.xlsxKey && entry.zipKey && !/成功|进行中|已跳过|已有内容|失败/.test(entry.status || ''));
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

  async function runUploadQueueItem(item) {
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
    const uploadFile = file instanceof File ? file : new File([file], filename, { type: guessMime(filename) });
    const namedFile = uploadFile.name === filename ? uploadFile : new File([uploadFile], filename, { type: uploadFile.type || guessMime(filename), lastModified: uploadFile.lastModified || Date.now() });
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
    if (lower.endsWith('.zip')) return 'application/zip';
    if (lower.endsWith('.rar')) return 'application/vnd.rar';
    return 'application/octet-stream';
  }

  function uploadFileKey(sku, kind) {
    return String(sku || '') + ':' + String(kind || '');
  }

  function runSearch() {
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
      state.view = 'detail';
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
    showToast(L.openingDetail);
    try {
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
    expandPanel();
    renderShell();
  }

  function adoptOpenedProjectDrawer(sku) {
    const drawer = getProjectDrawerForSku(sku);
    if (!drawer) return;
    state.drawer = drawer;
    state.sku = sku;
    state.selectedSku = sku;
    if (state.data && state.data.sku === sku) return;
    const cached = loadData(sku);
    if (cached) state.data = normalizeData(cached);
  }

  async function queryProjectRowIdBySku(sku) {
    const input = findInputByPlaceholder('\u641c\u7d22\u5546\u54c1\u7f16\u7801');
    const button = findButtonByText('\u67e5\u8be2');
    if (!input || !button) return '';
    setNativeInputValue(input, sku);
    button.click();
    return await waitFor(() => findProjectRowIdBySku(sku), 5000, 150);
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
    state.excelPurchasePrice = '6';
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
      if (state.excelMissing.length) showExcelMissingToast();
    } catch (error) {
      console.warn('PLM floating helper excel prepare failed:', error);
      state.excelExtra = null;
      state.excelMissing = ['\u8bbe\u8ba1\u8d44\u6599'];
      state.excelStatus = L.excelIncomplete;
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

  async function generateToyLabelFromCurrent() {
    let data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) {
      showToast(L.excelNeedData);
      return;
    }
    syncExcelInputs();
    try {
      if (!state.excelExtra || !state.excelExtra.excelData || state.excelExtra.excelData.sku !== data.sku) {
        await prepareExcelInfo();
        data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
      }
      const extra = state.excelExtra && state.excelExtra.extra ? state.excelExtra.extra : {};
      const labelData = normalizeData((state.excelExtra && state.excelExtra.excelData) || data);
      state.excelStatus = L.labelGenerating;
      renderShell();
      showToast(L.labelGenerating);

      const imageSource = getToyLabelImageSource(labelData, extra);
      const productImage = imageSource.imageUrl ? await fetchImageForExcel(imageSource.imageUrl, imageSource.imageFallbackUrl).catch((error) => {
        console.warn('PLM floating helper label product image fetch failed:', error);
        addLog('error', '\u73a9\u5177\u6807\u7b7e\uff1a\u4ea7\u54c1\u56fe\u83b7\u53d6\u5931\u8d25', error && error.message ? error.message : '');
        return null;
      }) : null;
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
      downloadBlob(previewBlob, baseName + ' \u6807\u7b7e\u8bf4\u660e\u56fe.jpg');
      await wait(250);
      downloadBlob(printBlob, baseName + ' \u6807\u7b7e\u5370\u5237' + sizeName + '.jpg');
      await wait(250);
      downloadBlob(psdBlob, baseName + ' \u6807\u7b7e\u5370\u5237' + sizeName + '.psd');
      state.excelStatus = L.labelDone;
      renderShell();
      addLog('success', '\u73a9\u5177\u6807\u7b7e\u751f\u6210\u6210\u529f', labelData.sku);
      showToast(L.labelDone);
    } catch (error) {
      console.warn('PLM floating helper label failed:', error);
      state.excelStatus = L.labelFailed;
      renderShell();
      addLog('error', '\u73a9\u5177\u6807\u7b7e\u751f\u6210\u5931\u8d25', error && error.message ? error.message : '');
      showToast(L.labelFailed);
    }
  }

  function getToyLabelSizeCm(data) {
    const nums = parseDimension((data && data.printSizeText) || '', 2) || parseDimension((data && data.printSizeLabel) || '', 2);
    const width = nums && nums[0] ? Number(nums[0]) : 4;
    const height = nums && nums[1] ? Number(nums[1]) : 3;
    return { width: width || 4, height: height || 3 };
  }

  function getToyLabelImageSource(data, extra) {
    const source = getExcelImageSource(data, extra);
    const imageUrl = stripOssResizeParams(source.imageUrl || '');
    const imageFallbackUrl = stripOssResizeParams(source.imageFallbackUrl || '');
    return {
      imageUrl: imageUrl || source.imageUrl || '',
      imageFallbackUrl: imageFallbackUrl || imageUrl || source.imageFallbackUrl || '',
    };
  }

  async function getBarcodeForToyLabel(sku) {
    const plm = await getPlmBarcodePreviewImage(sku).catch(() => null);
    if (plm && plm.dataUrl) {
      const size = await getImageSize(plm.dataUrl).catch(() => ({ width: 0, height: 0 }));
      if (size.width >= 220 && size.height >= 60) {
        return { dataUrl: plm.dataUrl, source: 'plm' };
      }
    }
    addLog('info', '\u73a9\u5177\u6807\u7b7e\uff1a\u4f7f\u7528 SKU \u751f\u6210\u6761\u7801', sku);
    showToast(L.labelNeedBarcode);
    return { canvas: renderCode128Barcode(sku, 900, 210), source: 'generated' };
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

    const barcodeBox = { x: width * 0.19, y: height * 0.61, w: width * 0.62, h: height * 0.19 };
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
    ctx.font = '500 ' + Math.round(height * 0.06) + 'px Arial, sans-serif';
    ctx.fillText(options.sku || '', width / 2, height * 0.85);
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
      includesImageLinks: true,
      index: state.index,
      items,
      uploadRecords: {
        queue: sanitizeUploadRecords(state.uploadQueue || loadUploadQueue()),
        history: sanitizeUploadRecords(state.uploadHistory || loadUploadHistory()),
      },
    };
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
  }

  function getCloudBackupKey() {
    return String(state.settings.cloudBackupKey || '').trim();
  }

  function getCloudBackupStatusText() {
    return state.cloudBackupStatus || state.settings.cloudBackupStatus || L.cloudBackupReady;
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
    state.cloudBackupTimer = window.setTimeout(() => runQueuedCloudBackup(), 600);
  }

  async function runQueuedCloudBackup() {
    if (!state.cloudBackupQueued || state.cloudBackupRunning) return;
    state.cloudBackupQueued = false;
    await saveCloudBackup({ silent: true });
    if (state.cloudBackupQueued) window.setTimeout(() => runQueuedCloudBackup(), 1000);
  }

  async function saveCloudBackupNow() {
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
      const response = await cloudRequest('/backup/save', {
        method: 'POST',
        body: {
          backupKey,
          version: SCRIPT_VERSION,
          payload,
        },
      });
      if (!response || !response.ok) throw new Error(response && response.error ? response.error : 'save failed');
      setCloudBackupStatus(L.cloudBackupSavedAt + ' ' + new Date().toLocaleTimeString() + '\uff0c' + state.index.length + '\u4e2a\u7f16\u7801');
      addLog('success', '\u4e91\u5907\u4efd\u4e0a\u4f20\u6210\u529f', state.index.length + '\u4e2a\u7f16\u7801');
      if (!(options && options.silent)) showToast(L.cloudBackupSaved);
      return true;
    } catch (error) {
      console.warn('PLM floating helper cloud backup save failed:', error);
      setCloudBackupStatus(L.cloudBackupFailed + '\uff1a' + (error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef'));
      addLog('error', '\u4e91\u5907\u4efd\u4e0a\u4f20\u5931\u8d25', error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef');
      if (!(options && options.silent)) showToast(L.cloudBackupFailed + '\uff1a' + (error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef'));
      return false;
    } finally {
      state.cloudBackupRunning = false;
    }
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
      importCachePayload(response.payload);
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

  function cloudRequest(path, options) {
    const method = (options && options.method) || 'GET';
    const body = options && options.body ? JSON.stringify(options.body) : null;
    const url = CLOUD_BACKUP_API_BASE + path;
    return new Promise((resolve, reject) => {
      const handleLoad = (response) => {
        const text = response.responseText || '';
        let data = null;
        try {
          data = text ? JSON.parse(text) : {};
        } catch (error) {
          reject(error);
          return;
        }
        if (response.status < 200 || response.status >= 300) {
          reject(new Error(formatCloudError(data, response.status)));
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
          onerror: reject,
          ontimeout: () => reject(new Error('timeout')),
          timeout: 30000,
        });
        return;
      }
      fetch(url, {
        method,
        headers: {
          'content-type': 'application/json',
          'x-api-key': CLOUD_BACKUP_API_KEY,
        },
        body,
      }).then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(formatCloudError(data, response.status));
        return data;
      }).then(resolve, reject);
    });
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
    const defaults = { excelKeywordMode: 'english', excelDownloadMode: 'picker', backgroundNoticeSeen: false };
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

  function getTutorialPlainText() {
    return [
      '1. \u6253\u5f00 PLM \u9879\u76ee\u8be6\u60c5\uff0c\u52a9\u624b\u4f1a\u81ea\u52a8\u5c55\u5f00\u5e76\u8bc6\u522b\u5f53\u524d SKU\u3002',
      '2. \u9996\u6b21\u6ca1\u7f13\u5b58\u65f6\u7b49\u5b83\u8dd1\u5b8c\u4e00\u8f6e\uff1b\u8bc6\u522b\u9519\u4e86\u5c31\u70b9\u53f3\u4e0b\u89d2\u5237\u65b0\u3002',
      '3. \u6bcf\u884c\u526a\u5200\u6309\u94ae\u53ef\u590d\u5236\u5355\u9879\u6570\u636e\uff0c\u5de6\u4fa7\u53ef\u641c\u7d22\u4ea7\u54c1\u540d\u3001SKU\u3001\u7269\u6599\u7f16\u7801\u3002',
      '4. \u5bfc\u51fa Excel \u524d\u586b\u88c5\u7bb1\u6570\u548c\u4ef7\u683c\uff0c\u70b9\u91cd\u65b0\u83b7\u53d6\u770b\u7ea2\u7eff\u706f\uff0c\u518d\u70b9\u751f\u6210\u3002',
      '5. \u63d0\u5ba1\u4e0a\u4f20\u9875\u628a xlsx/zip \u62d6\u5165\uff0c\u6587\u4ef6\u540d\u91cc\u7684 SKU \u4f1a\u81ea\u52a8\u5165\u961f\uff0c\u6587\u4ef6\u9f50\u5168\u624d\u4f1a\u6267\u884c\u3002',
      '6. ' + L.backgroundAutomationText,
      '7. \u8bbe\u7f6e\u91cc\u53ef\u91cd\u65b0\u6253\u5f00\u672c\u6559\u7a0b\uff0c\u4e5f\u53ef\u5bfc\u51fa/\u5bfc\u5165\u7f13\u5b58\u7ed9\u5907\u4efd\u6216\u6362\u7535\u8111\u7528\u3002',
    ].join('\n');
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
      status: item.status || L.uploadSuccess,
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
    const archived = { ...latestItem, status: L.uploadSuccess, step: L.uploadSuccess, completedAt, updatedAt: completedAt, xlsxKey: '', zipKey: '' };
    const archivedKey = uploadHistoryKey(archived);
    state.uploadQueue = latestQueue.filter((entry) => entry.id !== item.id && uploadHistoryKey(entry) !== archivedKey);
    state.uploadHistory = [archived].concat(latestHistory.filter((entry) => uploadHistoryKey(entry) !== archivedKey)).slice(0, 200);
    cleanupUploadFiles(latestItem);
    saveUploadHistory();
    saveUploadQueue();
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
    const normalized = normalizeData({ ...data, updatedAt: data.updatedAt || new Date().toLocaleString(), updatedAtMs: data.updatedAtMs || Date.now() });
    try {
      saveDataDirect(sku, normalized);
      state.data = normalized;
      state.selectedSku = sku;
      upsertIndex(normalized);
      queueCloudBackup();
      schedulePackAiEstimate(normalized);
    } catch (error) {
      console.warn('PLM floating helper save failed:', error);
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
      panel.style.right = '18px';
      panel.style.bottom = '78px';
      return;
    }
    if (Number.isFinite(pos.right)) panel.style.right = pos.right + 'px';
    if (Number.isFinite(pos.bottom)) panel.style.bottom = pos.bottom + 'px';
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
    launcher.style.left = Math.min(window.innerWidth - buttonWidth - 18, Math.max(18, Math.round(window.innerWidth * 0.36))) + 'px';
    launcher.style.top = Math.max(12, window.innerHeight - buttonHeight - 20) + 'px';
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
      return { width: 880, height: 820 };
    } catch (error) {
      return { width: 880, height: 820 };
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
    panel.style.width = clamp(state.panelSize.width, 520, Math.min(1180, window.innerWidth - 24)) + 'px';
    panel.style.height = height + 'px';
    panel.style.maxHeight = getPanelMaxHeight() + 'px';
    const main = panel.querySelector('.pfh-main');
    if (main) main.style.height = 'auto';
  }

  function getPanelMaxHeight() {
    return Math.max(520, Math.floor(window.innerHeight * 0.96));
  }

  function loadSplitWidth() {
    try {
      const value = typeof GM_getValue === 'function' ? GM_getValue(SPLIT_KEY, 150) : Number(localStorage.getItem(SPLIT_KEY) || 150);
      return clamp(Number(value) || 150, 110, 260);
    } catch (error) {
      return 150;
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
    if (main) main.style.gridTemplateColumns = state.splitWidth + 'px 6px minmax(0, 1fr)';
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
      const main = panel.querySelector('.pfh-main');
      startX = event.clientX;
      startY = event.clientY;
      startWidth = panel.getBoundingClientRect().width;
      startHeight = main ? main.getBoundingClientRect().height : state.panelSize.height;
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
      #${PANEL_ID} .pfh-main.is-home {
        grid-template-columns: 0 0 minmax(0, 1fr);
      }
      #${PANEL_ID} .pfh-main.is-home .pfh-list,
      #${PANEL_ID} .pfh-main.is-home .pfh-splitter {
        display: none;
      }
      #${PANEL_ID} .pfh-main.is-home .pfh-detail {
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
        margin: 16px auto;
        max-width: 220px;
        text-align: center;
        color: #475569;
        font-weight: 700;
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
      #${PANEL_ID} .pfh-excel-controls.is-open {
        flex: 1 1 auto;
        justify-content: flex-end;
      }
      #${PANEL_ID} .pfh-excel-controls input,
      #${PANEL_ID} .pfh-excel-controls select {
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
      #${PANEL_ID} .pfh-excel-controls select {
        width: 96px;
        flex: 0 0 96px;
      }
      #${PANEL_ID} .pfh-excel-controls input:focus,
      #${PANEL_ID} .pfh-excel-controls select:focus {
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
      #${PANEL_ID} .pfh-excel-controls.is-open {
        flex: 0 1 auto;
        max-width: 540px;
      }
      #${PANEL_ID} .pfh-excel-controls.is-open input {
        width: 68px;
        flex: 0 0 68px;
        border-radius: 10px;
        background: rgba(255,255,255,.74);
      }
      #${PANEL_ID} .pfh-excel-controls.is-open select {
        border-radius: 10px;
        background: rgba(255,255,255,.74);
      }
      #${PANEL_ID} .pfh-excel-controls.is-open > button[data-action="excel-prepare"] {
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
        min-width: 110px;
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
      #${PANEL_ID} .pfh-main.is-home .pfh-detail {
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
      #${PANEL_ID} .pfh-main.is-home .pfh-detail {
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
      #${PANEL_ID} .pfh-info-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 12px 14px !important;
        align-items: stretch !important;
      }
      #${PANEL_ID} .pfh-file-section .pfh-info-grid {
        margin-top: 14px !important;
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
        gap: 8px 8px !important;
        justify-items: start !important;
        text-align: left !important;
        min-height: 64px !important;
        padding: 13px 18px !important;
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
        line-height: 1.25 !important;
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
      #${PANEL_ID} .pfh-main:not(.is-home) .pfh-splitter {
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
      #${PANEL_ID} .pfh-main:not(.is-home) .pfh-splitter::before {
        content: '' !important;
        position: absolute !important;
        top: 0 !important;
        bottom: 0 !important;
        left: -8px !important;
        right: -8px !important;
        cursor: col-resize !important;
        pointer-events: auto !important;
      }
      #${PANEL_ID} .pfh-main:not(.is-home) .pfh-list,
      #${PANEL_ID} .pfh-main:not(.is-home) .pfh-detail {
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
      @media (max-width: 760px) {
        #${PANEL_ID} .pfh-info-grid {
          grid-template-columns: 1fr !important;
        }
      }
    `;
    document.documentElement.appendChild(style);
  }
})();
