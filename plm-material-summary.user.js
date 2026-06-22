// ==UserScript==
// @name         PLM悬浮助手
// @namespace    https://plm.westmonth.com/
// @version      2.3.16
// @description  Store PLM project packaging specs locally and show them in a floating helper.
// @author       Violet
// @match        https://plm.westmonth.com/*
// @require      https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      oss-pro.plm.westmonth.cn
// @connect      plm.westmonth.com
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const PANEL_ID = 'plm-floating-helper';
  const SCRIPT_VERSION = '2.3.16';
  const STORAGE_PREFIX = 'plm-floating-helper:data:';
  const STORAGE_INDEX_KEY = 'plm-floating-helper:index';
  const POSITION_KEY = 'plm-floating-helper:position';
  const SPLIT_KEY = 'plm-floating-helper:split-width';
  const SIZE_KEY = 'plm-floating-helper:size';
  const SETTINGS_KEY = 'plm-floating-helper:settings';
  const TUTORIAL_SEEN_KEY = 'plm-floating-helper:tutorial-seen';
  const UPLOAD_QUEUE_KEY = 'plm-floating-helper:upload-queue';
  const UPLOAD_HISTORY_KEY = 'plm-floating-helper:upload-history';
  const UPLOAD_WORKER_KEY = 'plm-floating-helper:upload-worker-running';
  const UPLOAD_DB_NAME = 'plm-floating-helper-files';
  const UPLOAD_DB_STORE = 'files';
  const UPLOAD_MAX_ZIP_BYTES = 100 * 1024 * 1024;
  const PRODUCT_REPLACE_UPLOAD_LABELS = ['\u4e3b\u56fe', '\u82f1\u6587\u53c2\u6570\u56fe', '\u8be6\u60c5\u56fe', 'SKU\u56fe', '\u89c6\u9891', '\u52a8\u56fe', '\u63a8\u54c1\u8d44\u6599', '\u56fe\u5305\u7d20\u6750'];
  const DETAIL_IMAGE_DOWNLOAD_CLASS = 'pfh-detail-image-download';
  const CM_TO_INCH = 1 / 2.54;
  const NORMAL_DELTA_CM = 0.2;
  const INNER_CARD_DELTA_CM = 0.5;
  const AUTO_SCAN_ATTEMPTS = 10;
  const REFRESH_SCAN_ATTEMPTS = 10;
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
    easterEgg: '\ud83d\udc14\ud83d\udc14\ud83d\udc14\ud83d\udc14\ud83d\udc14\ud83d\udc14\ud83d\udc14\ud83d\udc14\ud83d\udc14',
    exportCache: '\u5bfc\u51fa\u7f13\u5b58',
    importCache: '\u5bfc\u5165\u7f13\u5b58',
    importDone: '\u7f13\u5b58\u5df2\u5bfc\u5165',
    importFailed: '\u5bfc\u5165\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u6587\u4ef6',
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
    uploadFailed: '\u4e0a\u4f20\u5931\u8d25',
    uploadFileTooLarge: '\u56fe\u5305\u8d85\u8fc7 100MB\uff0c\u5df2\u8df3\u8fc7',
    backgroundAutomationTitle: '\u540e\u53f0\u81ea\u52a8\u5316\u63d0\u793a',
    backgroundAutomationText: '\u5982\u9700\u8ba9\u6d4f\u89c8\u5668\u5728\u540e\u53f0\u7a33\u5b9a\u6267\u884c\u6279\u91cf\u4e0a\u4f20\uff0c\u5efa\u8bae\u5728 Chrome \u5feb\u6377\u65b9\u5f0f\u7684\u76ee\u6807\u8def\u5f84\u672b\u5c3e\u8ffd\u52a0\u542f\u52a8\u53c2\u6570\uff1a --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-gpu-sandbox --no-sandbox\u3002\u4fee\u6539\u540e\u9700\u5b8c\u5168\u9000\u51fa\u5e76\u91cd\u65b0\u542f\u52a8 Chrome \u624d\u4f1a\u751f\u6548\u3002',
    panelPin: '\u7f6e\u9876',
    settingsTitle: '\u8bbe\u7f6e',
  };
  const TOOLTIP = {
    about: '\u5173\u4e8e',
    openDetail: '\u6253\u5f00\u5f53\u524d\u7f16\u7801\u7684\u9879\u76ee\u8be6\u60c5',
    refresh: '\u5237\u65b0',
    copy: '\u590d\u5236',
    pin: '\u7f6e\u9876',
    unpin: '\u53d6\u6d88\u7f6e\u9876',
    panelPin: '\u7f6e\u9876\u60ac\u6d6e\u7a97',
    collapse: '\u6536\u8d77',
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
    nextTabTarget: L.materialTab,
    lastTabClickAt: 0,
    toastTimer: 0,
    materialWatchTimer: 0,
    materialWatchAttempts: 0,
    ignoreOutsideClickUntil: 0,
    splitWidth: loadSplitWidth(),
    panelSize: loadPanelSize(),
    searchQuery: '',
    view: firstTutorial ? 'tutorial' : 'detail',
    settings: loadSettings(),
    excelPanelOpen: false,
    excelExtra: null,
    excelMissing: [],
    excelStatus: '',
    excelPackQty: '',
    excelPurchasePrice: '6',
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
    panelPinned: Boolean(loadSettings().panelPinned),
    manuallyCollapsedForSku: '',
    userCollapsedPanel: false,
    skuPage: 1,
  };
  state.expanded = firstTutorial;

  injectStyle();
  ensurePanel();
  renderShell(L.noDrawer);
  document.addEventListener('click', handleOutsideClick, true);
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
      }, 120);
    }).observe(document.body, { childList: true, subtree: true });
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
      stopScan();
      stopMaterialWatch();
      state.drawer = null;
      state.sku = '';
      if (state.view === 'tutorial' || state.view === 'about' || state.view === 'upload') {
        if (state.userCollapsedPanel) return;
        expandPanel();
        return;
      }
      collapsePanel();
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
      resetExcelState();
      expandPanel();
      upsertIndex(state.data);
      stopScan();
      renderShell(L.checkingMaterial);
      startMaterialWatch();
      return;
    }

    state.drawer = drawer;
    state.sku = sku || '';
    state.data = sku ? normalizeData({ sku, name: cleanName((text.match(/\u5546\u54c1\u540d\u79f0[:\uff1a]\s*([^\n]+)/) || [])[1] || '') }) : null;
    state.selectedSku = sku || '';
    resetExcelState();
    resetRound(AUTO_SCAN_ATTEMPTS);
    expandPanel();
    renderShell(L.scanning);
    startScan();
  }

  function resetRound(maxAttempts) {
    stopScan();
    state.scanAttempts = 0;
    state.maxAttempts = maxAttempts;
    state.scanRunning = false;
    state.scanTargetSku = '';
    state.seenMaterial = false;
    state.seenProduct = false;
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
    state.data = createRefreshSeedData(targetSku);
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
    state.scanTargetSku = '';
    renderShell(L.scanDone);
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
    const packaging = seenMaterial ? extractPackaging(drawer) : emptyPackaging();
    const outer = extractOuterPackage(drawer);
    const food = seenMaterial ? extractFoodSemiFinished(drawer) : emptyFoodSemiFinished();
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
      seenMaterial,
      seenProduct,
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
    merged.seenMaterial = previous.seenMaterial || next.seenMaterial;
    merged.seenProduct = previous.seenProduct || next.seenProduct;
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
    const isTubePrint = Boolean(safe.isTubePrintMaterial) || /\u5370\u5237\u8f6f\u7ba1|\u5370\u5237\u7ba1|\u8f6f\u7ba1/.test(String(safe.printSizeLabel || '') + String(safe.printSizeText || ''));
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
    const printRows = rows.filter((row) => !/(\u8bf4\u660e\u4e66|\u5370\u5237\u81ea\u7acb\u888b|\u5370\u5237\u888b|\u5305\u88c5\u888b|\u94dd\u7b94\u888b|\u81ea\u5c01\u888b|\u888b\u5b50)/.test(row) && ((/\u5305\u6750/.test(row) && /(\u6807\u7b7e|\u5370\u5237\u8f6f\u7ba1|\u5370\u5237\u5c3a\u5bf8|\u5370\u5237\u7ba1|\u5370\u5237\u74f6|\u5370\u5237\u4e73\u6db2\u74f6|\u8f6f\u7ba1)/.test(row)) || (/\u5305\u6750/.test(row) && /\u5370\u5237/.test(row) && /\d+(?:\.\d+)?\s*[xX\u00d7*]\s*\d+(?:\.\d+)?\s*cm/i.test(row)) || (/\u5370\u5237(?:\u74f6|\u7ba1|\u8f6f\u7ba1|\u4e73\u6db2\u74f6)/.test(row) && /\u5370\u5237[^\d]{0,12}\d+(?:\.\d+)?\s*[xX\u00d7*]\s*\d+(?:\.\d+)?\s*cm/i.test(row))));
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
      const tubeMatch = source.match(/\u5370\u5237(?:\u5c3a\u5bf8)?[^\d]{0,8}(\d+(?:\.\d+)?\s*[xX\u00d7*]\s*\d+(?:\.\d+)?\s*cm)/i);
      return tubeMatch ? [normalizeDimensionText(tubeMatch[1])] : [];
    }
    const pattern = /(?:([\u4e00-\u9fa5A-Za-z0-9锛堬級()_-]{1,16})[:\uff1a]\s*)?(\d+(?:\.\d+)?\s*[xX\u00d7*]\s*\d+(?:\.\d+)?(?:\s*[xX\u00d7*]\s*\d+(?:\.\d+)?){0,4}\s*cm)/ig;
    const items = [];
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
      items.push(name && !isGenericDimensionName(name) ? name + '\uff1a' + dim : dim);
    }
    return items;
  }

  function isGenericDimensionName(name) {
    return /^(?:\u5370\u5237|\u6807\u7b7e|\u5370\u5237\u5c3a\u5bf8|\u6807\u7b7e\u5c3a\u5bf8|\u5c3a\u5bf8)$/.test(String(name || '').trim());
  }

  function isTubePrintRow(row) {
    const text = String(row || '');
    return /\u5370\u5237(?:\u8f6f\u7ba1|\u7ba1|\u74f6|\u4e73\u6db2\u74f6)/.test(text) || (/\u8f6f\u7ba1|\u7ba1/.test(text) && /\u5370\u5237(?:\u5c3a\u5bf8)?/.test(text));
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
    const matches = String(text || '').match(/\d+(?:\.\d+)?(?:\s*[xX\u00d7*]\s*\d+(?:\.\d+)?\s*(?:cm)?){1,4}\s*cm/ig);
    if (!matches || !matches.length) return '';
    return normalizeDimensionText(matches[matches.length - 1]);
  }

  function normalizeDimensionText(text) {
    const nums = String(text || '').match(/\d+(?:\.\d+)?/g);
    if (!nums || nums.length < 2) return '';
    return nums.map((n) => trimNumber(Number(n))).join('x') + 'cm';
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
      panel.dataset.version = SCRIPT_VERSION;
      return panel;
    }
    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.dataset.version = SCRIPT_VERSION;
    panel.innerHTML = '<button type="button" class="pfh-mini" data-action="expand"></button><div class="pfh-full"><div class="pfh-header"><div class="pfh-heading"><strong></strong><div class="pfh-search"><span class="pfh-search-box"><input type="search" class="pfh-search-input"><button type="button" class="pfh-search-clear" data-action="clear-search"></button></span><button type="button" data-action="search"></button></div></div><div class="pfh-actions"><button type="button" data-action="about"></button><button type="button" data-action="open-detail"></button><button type="button" data-action="upload-toggle"></button><button type="button" data-action="collapse"></button></div></div><div class="pfh-main"><aside class="pfh-list"></aside><div class="pfh-splitter" title="\u62d6\u52a8\u8c03\u6574\u5de6\u53f3\u5bbd\u5ea6"></div><div class="pfh-detail"></div></div><input type="file" class="pfh-import-file" accept="application/json,.json"><div class="pfh-resize-handle pfh-resize-n" data-resize-dir="n"></div><div class="pfh-resize-handle pfh-resize-e" data-resize-dir="e"></div><div class="pfh-resize-handle pfh-resize-s" data-resize-dir="s"></div><div class="pfh-resize-handle pfh-resize-w" data-resize-dir="w"></div><div class="pfh-resize-handle pfh-resize-ne" data-resize-dir="ne"></div><div class="pfh-resize-handle pfh-resize-nw" data-resize-dir="nw"></div><div class="pfh-resize-handle pfh-resize-se" data-resize-dir="se" title="\u62d6\u52a8\u8c03\u6574\u7a97\u53e3\u5927\u5c0f"></div><div class="pfh-resize-handle pfh-resize-sw" data-resize-dir="sw"></div></div>';
    document.documentElement.appendChild(panel);
    panel.querySelector('.pfh-mini').textContent = L.mini;
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
    panel.querySelector('[data-action="collapse"]').setAttribute('data-action', 'panel-pin-toggle');
    panel.querySelector('[data-action="upload-toggle"]').innerHTML = iconHtml('upload') + '<span>\u63d0\u5ba1\u4e0a\u4f20</span>';
    panel.querySelector('[data-action="upload-toggle"]').title = L.uploadSection;
    panel.addEventListener('click', handlePanelClick);
    panel.addEventListener('keydown', handlePanelKeydown);
    panel.addEventListener('input', handlePanelInput);
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

  function iconHtml(name) {
    const icons = {
      settings: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M512.7 664.3c-82.9 0-150.4-67.4-150.4-150.4 0-82.9 67.4-150.4 150.4-150.4 82.9 0 150.4 67.4 150.4 150.4-0.1 83-67.5 150.4-150.4 150.4z m0-244.7c-52 0-94.4 42.3-94.4 94.4 0 52 42.3 94.4 94.4 94.4S607 566 607 514c0-52-42.3-94.4-94.3-94.4z"></path><path d="M631.2 940.5c-15.2 0-30.1-6-41.2-17.3l-63.5-64.8c-4.1-4.2-9.5-6.5-15.4-6.5-5.8 0-11.3 2.3-15.3 6.4l-63.5 64.4c-17.4 17.6-44 22.2-66.2 11.4l-94.5-45.7c-22.2-10.8-35.2-34.5-32.2-59l11-90.1c0.7-5.8-0.9-11.5-4.5-16-3.6-4.6-8.8-7.4-14.6-8l-89.9-9.5c-24.6-2.6-44.8-20.5-50.2-44.6L67.7 558.8c-5.5-24.1 5-49 26-62l77.3-47.6c5-3.1 8.4-7.9 9.7-13.5 1.3-5.7 0.3-11.5-2.8-16.4L129.2 343c-13.3-20.8-11.9-47.8 3.5-67.1l65.5-82c15.4-19.3 41.4-26.7 64.7-18.3l85.4 30.7c5.5 2 11.4 1.7 16.6-0.9 5.2-2.5 9.2-7 11.1-12.5l29.2-85.6c8-23.4 29.9-39.1 54.6-39.1h105c24.7 0 46.7 15.7 54.6 39.1l29.6 86.8c1.9 5.5 5.8 9.9 11 12.5s11.1 2.8 16.6 0.9l86.1-30.6c23.3-8.3 49.2-0.8 64.6 18.5l65.2 82.3c15.3 19.4 16.7 46.3 3.3 67.1l-49.1 76.3c-3.2 4.9-4.2 10.7-2.9 16.4 1.3 5.7 4.7 10.5 9.7 13.6l76.8 47.7c21 13 31.4 38 25.8 62l-23.6 102.3a57.67 57.67 0 0 1-50.4 44.4l-90.3 9.2c-5.8 0.6-11 3.4-14.6 8-3.6 4.5-5.3 10.2-4.6 16l10.7 89.8c2.9 24.5-10.1 48.2-32.4 58.9l-94.7 45.4c-8.1 3.9-16.6 5.7-25 5.7zM511 795.9h0.1c21 0 40.6 8.3 55.3 23.3l63.5 64.8c0.5 0.5 1.3 0.7 2 0.4l94.7-45.4c0.7-0.3 1.1-1 1-1.8l-10.7-89.8c-2.5-20.8 3.4-41.3 16.5-57.6s31.8-26.5 52.7-28.7l90.3-9.2c0.7-0.1 1.3-0.6 1.5-1.3l23.6-102.3c0.2-0.7-0.1-1.5-0.8-1.9l-76.8-47.7c-17.8-11.1-30.2-28.4-34.8-48.8-4.6-20.4-0.9-41.4 10.5-59l49.1-76.3c0.4-0.6 0.4-1.4-0.1-2l-65.2-82.3c-0.5-0.6-1.2-0.8-1.9-0.6l-86.1 30.6c-19.7 7-40.9 5.9-59.7-3.2-18.8-9.1-32.9-25-39.7-44.8l-29.6-86.8c-0.2-0.7-0.9-1.2-1.6-1.2h-105c-0.7 0-1.4 0.5-1.6 1.2L429 211c-6.8 19.8-20.9 35.8-39.8 44.9-18.9 9.1-40.1 10.2-59.9 3.1l-85.4-30.7c-0.7-0.2-1.5 0-1.9 0.5l-65.5 82c-0.5 0.6-0.5 1.4-0.1 2l48.7 76.2c11.3 17.7 14.9 38.6 10.2 59.1-4.7 20.4-17.1 37.7-34.9 48.7l-77.3 47.6c-0.6 0.4-0.9 1.1-0.8 1.9l23.3 102.4c0.2 0.7 0.8 1.3 1.5 1.3l89.9 9.5c20.8 2.2 39.5 12.4 52.6 28.8 13 16.4 18.8 36.9 16.3 57.7l-11 90.1c-0.1 0.7 0.3 1.4 1 1.8l94.5 45.7c0.7 0.3 1.5 0.2 2-0.3l63.5-64.4c14.6-14.8 34.2-23 55.1-23z"></path></svg>',
      folder: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M752 80H272c-70.4 0-128 57.6-128 128v608c0 70.4 57.6 128 128 128h353.6c33.6 0 65.6-12.8 91.2-36.8l126.4-126.4c24-24 36.8-56 36.8-91.2V208c0-70.4-57.6-128-128-128zM208 816V208c0-35.2 28.8-64 64-64h480c35.2 0 64 28.8 64 64v464h-96c-70.4 0-128 57.6-128 128v80H272c-35.2 0-64-28.8-64-64z m462.4 44.8c-4.8 4.8-9.6 8-14.4 11.2V800c0-35.2 28.8-64 64-64h75.2l-124.8 124.8z"></path><path d="M368 352h288c17.6 0 32-14.4 32-32s-14.4-32-32-32H368c-17.6 0-32 14.4-32 32s14.4 32 32 32zM496 608h-128c-17.6 0-32 14.4-32 32s14.4 32 32 32h128c17.6 0 32-14.4 32-32s-14.4-32-32-32zM368 512h288c17.6 0 32-14.4 32-32s-14.4-32-32-32H368c-17.6 0-32 14.4-32 32s14.4 32 32 32z"></path></svg>',
      upload: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M802 664v146c0 7.7-6.3 14-14 14H236c-7.7 0-14-6.3-14-14V664c0-5.5-4.5-10-10-10h-50c-5.5 0-10 4.5-10 10v170c0 33.1 26.9 60 60 60h600c33.1 0 60-26.9 60-60V664c0-5.5-4.5-10-10-10h-50c-5.5 0-10 4.5-10 10z"></path><path d="M547 697V247.5l173.6 173.6c13.7 13.7 35.8 13.7 49.5 0 13.7-13.7 13.7-35.8 0-49.5L536.8 138.3c-0.4-0.4-0.8-0.8-1.3-1.2-0.2-0.2-0.4-0.4-0.6-0.5-0.2-0.2-0.4-0.4-0.7-0.6-0.3-0.2-0.5-0.4-0.8-0.6-0.2-0.1-0.4-0.3-0.5-0.4l-0.9-0.6c-0.2-0.1-0.3-0.2-0.5-0.3-0.3-0.2-0.6-0.4-1-0.6-0.2-0.1-0.3-0.2-0.5-0.3-0.3-0.2-0.6-0.4-1-0.5-0.2-0.1-0.4-0.2-0.5-0.3-0.3-0.2-0.6-0.3-0.9-0.5l-0.6-0.3c-0.3-0.1-0.6-0.3-0.8-0.4-0.2-0.1-0.5-0.2-0.7-0.3-0.3-0.1-0.5-0.2-0.8-0.3l-0.9-0.3c-0.2-0.1-0.4-0.2-0.7-0.2-0.3-0.1-0.6-0.2-1-0.3-0.2-0.1-0.4-0.1-0.6-0.2-0.4-0.1-0.7-0.2-1.1-0.3-0.2 0-0.4-0.1-0.6-0.1-0.4-0.1-0.7-0.2-1.1-0.2-0.2 0-0.4-0.1-0.6-0.1-0.4-0.1-0.7-0.1-1.1-0.2-0.2 0-0.4-0.1-0.7-0.1-0.3 0-0.7-0.1-1-0.1-0.3 0-0.6 0-0.9-0.1-0.3 0-0.5 0-0.8-0.1-1.2-0.1-2.3-0.1-3.5 0-0.3 0-0.5 0-0.8 0.1-0.3 0-0.6 0-0.9 0.1-0.3 0-0.7 0.1-1 0.1-0.2 0-0.4 0.1-0.7 0.1-0.4 0.1-0.7 0.1-1.1 0.2-0.2 0-0.4 0.1-0.6 0.1-0.4 0.1-0.7 0.2-1.1 0.2-0.2 0-0.4 0.1-0.6 0.1-0.4 0.1-0.7 0.2-1.1 0.3-0.2 0.1-0.4 0.1-0.6 0.2-0.3 0.1-0.6 0.2-1 0.3-0.2 0.1-0.5 0.1-0.7 0.2l-0.9 0.3c-0.3 0.1-0.5 0.2-0.8 0.3-0.2 0.1-0.5 0.2-0.7 0.3-0.3 0.1-0.6 0.3-0.8 0.4l-0.6 0.3c-0.3 0.2-0.6 0.3-0.9 0.5-0.2 0.1-0.4 0.2-0.5 0.3-0.3 0.2-0.6 0.4-1 0.6-0.2 0.1-0.3 0.2-0.5 0.3-0.3 0.2-0.6 0.4-1 0.6-0.2 0.1-0.3 0.2-0.5 0.3-0.3 0.2-0.6 0.4-0.9 0.7-0.2 0.1-0.3 0.3-0.5 0.4-0.3 0.2-0.5 0.4-0.8 0.6-0.2 0.2-0.4 0.4-0.7 0.6-0.2 0.2-0.4 0.4-0.6 0.5l-1.2 1.2-233.1 233.1c-13.7 13.7-13.7 35.8 0 49.5 13.7 13.7 35.8 13.7 49.5 0L477 247.5V697c0 19.3 15.7 35 35 35s35-15.7 35-35z"></path></svg>',
      collapse: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="12" height="16" rx="2"></rect><path d="M9 8h6M9 12h6M9 16h4"></path></svg>',
      refresh: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M850.845805 255.97539c-16.530184-18.113648-44.618178-19.386339-62.717028-2.841357-18.09885 16.530184-19.386339 44.618178-2.841356 62.717028C847.63448 384.132412 881.967539 472.702825 881.967539 565.239298c0 98.825934-38.476704 191.732376-108.356318 261.61199s-162.786056 108.356318-261.61199 108.356318-191.732376-38.476704-261.61199-108.356318S142.030923 664.065232 142.030923 565.239298s38.476704-191.732376 108.356318-261.61199c53.556612-53.556612 120.639266-88.644407 193.537821-102.126052v71.655462c0 25.439021 29.952634 39.024257 49.087395 22.272092l139.063688-121.763969c13.466846-11.79459 13.466846-32.749595 0-44.529386L493.012457 7.386284C473.877696-9.365881 443.925062 4.219355 443.925062 29.658376v81.807393c-96.694917 14.295575-185.931273 59.002546-256.314044 129.385316C100.964441 327.497663 53.238529 442.705794 53.238529 565.239298s47.725912 237.741635 134.372489 324.388212 201.854709 134.37249 324.388213 134.37249 237.741635-47.725912 324.388213-134.37249 134.37249-201.854709 134.372489-324.388212c0-114.74937-42.590752-224.585562-119.914128-309.263908z"></path></svg>',
      pin: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M930.206 812.172c16.523 0 29.918 13.39 29.918 29.91 0 16.283-13.015 29.527-29.212 29.902l-0.706 0.008H94.794c-16.523 0-29.918-13.391-29.918-29.91 0-16.283 13.015-29.527 29.212-29.902l0.706-0.008h835.412zM577.584 146.059L929.58 538.586a87.467 87.467 0 0 1 22.347 58.396c0 48.299-39.143 87.453-87.43 87.453H160.504a87.416 87.416 0 0 1-58.38-22.352C66.18 629.832 63.179 574.54 95.42 538.586L447.418 146.06a87.441 87.441 0 0 1 6.704-6.706c35.944-32.25 91.22-29.248 123.462 6.706z m-82.956 37.345l-0.563 0.492a27.613 27.613 0 0 0-2.117 2.118L139.95 578.54c-10.181 11.354-9.233 28.814 2.117 38.999a27.605 27.605 0 0 0 18.436 7.059h703.996c15.248 0 27.609-12.365 27.609-27.617a27.621 27.621 0 0 0-7.057-18.44L533.053 186.013c-10.014-11.168-27.067-12.268-38.425-2.61z"></path></svg>',
      warning: '<svg viewBox="0 0 1026 1024" aria-hidden="true"><path d="M1004.657 801.716 602.263 91.599c-49.213-86.817-129.646-86.817-178.866 0L21.004 801.716c-49.207 86.906-8.949 157.798 89.388 157.798h804.877c98.337 0 138.556-70.892 89.388-157.798zM544.635 832.216h-63.649v-63.649h63.649v63.649zM544.635 641.27h-63.649V259.377h63.649V641.27z"></path></svg>',
      copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="6.5" r="2.5"></circle><path d="M8.5 8.2 19 20"></path><path d="M15.5 8.2 5 20"></path><path d="M10 13h4"></path></svg>',
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
    renderShell();
  }

  function collapsePanel(force) {
    if (window.getSelection && String(window.getSelection()).trim()) return;
    if (state.panelPinned && !force) return;
    if (!force && state.drawer && state.sku) state.manuallyCollapsedForSku = state.sku;
    state.userCollapsedPanel = true;
    state.expanded = false;
    const panel = ensurePanel();
    panel.style.display = 'block';
    panel.classList.add('is-collapsed');
    renderShell(L.noDrawer);
  }

  function togglePanelPinned() {
    state.panelPinned = !state.panelPinned;
    state.settings.panelPinned = state.panelPinned;
    saveSettings(state.settings);
    const panel = ensurePanel();
    panel.classList.toggle('is-panel-pinned', state.panelPinned);
    updatePanelPinButton(panel);
    if (state.panelPinned) {
      showToast(L.panelPin);
      return;
    }
    collapsePanel(true);
  }

  function updatePanelPinButton(panel) {
    const button = panel && panel.querySelector('[data-action="panel-pin-toggle"]');
    if (!button) return;
    button.innerHTML = iconHtml('pin') + '<span>' + escapeHtml(state.panelPinned ? L.collapse : L.panelPin) + '</span>';
    button.title = state.panelPinned ? TOOLTIP.collapse : TOOLTIP.panelPin;
    button.classList.toggle('is-panel-pinned', state.panelPinned);
    panel.classList.toggle('is-panel-pinned', state.panelPinned);
  }

  function updateSettingsNotice(panel) {
    const button = panel && panel.querySelector('[data-action="about"]');
    if (!button) return;
    button.classList.toggle('has-notice', !state.settings.backgroundNoticeSeen);
  }

  function renderShell(statusText) {
    const panel = ensurePanel();
    const scrollSnapshot = capturePanelScroll(panel);
    updatePanelPinButton(panel);
    updateSettingsNotice(panel);
    if (state.view === 'tutorial') renderTutorialList(panel);
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
      '<div class="pfh-about-note pfh-warning-note">' + iconHtml('warning') + '<div><strong>' + escapeHtml(L.backgroundAutomationTitle) + '</strong><p>' + escapeHtml(L.backgroundAutomationText) + '</p></div></div>',
      '<div class="pfh-easter-egg">' + escapeHtml(L.easterEgg) + '</div>',
      '<div class="pfh-about-note"><strong>' + escapeHtml(L.storageNote) + '</strong><p>' + escapeHtml(L.storageNoteText) + '</p></div>',
      '<div class="pfh-about-note pfh-manual-note"><strong>' + escapeHtml(L.tutorialText) + '</strong><p>' + escapeHtml(getTutorialPlainText()) + '</p></div>',
      '<div class="pfh-about-actions"><button type="button" data-action="export-cache">' + escapeHtml(L.exportCache) + '</button><button type="button" data-action="import-cache">' + escapeHtml(L.importCache) + '</button></div>',
      '<div class="pfh-about-actions"><button type="button" data-action="tutorial-open">' + escapeHtml(L.tutorialOpen) + '</button></div>',
      '</section></div>',
    ].join('');
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

  function renderSkuList(panel) {
    const list = panel.querySelector('.pfh-list');
    const query = state.searchQuery.trim().toLowerCase();
    const sortedItems = getSortedIndex();
    const allItems = query ? sortedItems.filter((item) => matchesSearchItem(item, query)) : sortedItems;
    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(allItems.length / pageSize));
    state.skuPage = clamp(state.skuPage || 1, 1, totalPages);
    const items = allItems.slice((state.skuPage - 1) * pageSize, state.skuPage * pageSize);
    const listHead = '<div class="pfh-list-head"><strong>SKU\u5217\u8868</strong></div>';
    const pager = '<div class="pfh-list-pager"><span>\u5171 ' + allItems.length + ' \u6761</span><div><button type="button" data-action="sku-page-prev"' + (state.skuPage <= 1 ? ' disabled' : '') + '>\u2039</button><b>' + state.skuPage + '</b><button type="button" data-action="sku-page-next"' + (state.skuPage >= totalPages ? ' disabled' : '') + '>\u203a</button></div></div>';
    if (!allItems.length) {
      list.innerHTML = listHead + '<div class="pfh-sku-scroll"><div class="pfh-empty">' + escapeHtml(query ? L.noSearchResult : L.emptyList) + '</div></div>' + pager;
      return;
    }
    list.innerHTML = listHead + '<div class="pfh-sku-scroll">' + (query ? '<div class="pfh-list-note">' + escapeHtml(L.searchResult + ': ' + allItems.length) + '</div>' : '') + items.map((item) => {
      const active = item.sku === state.selectedSku ? ' is-active' : '';
      const pinned = item.pinned ? ' is-pinned' : '';
      const title = [item.sku, item.name].filter(Boolean).join(' ');
      const pinTitle = item.pinned ? TOOLTIP.unpin : TOOLTIP.pin;
      const pinControl = active ? '<em data-pin-sku="' + escapeHtml(item.sku) + '" title="' + escapeHtml(pinTitle) + '">' + iconHtml('pin') + '</em>' : '';
      return '<button type="button" class="pfh-sku' + active + pinned + '" data-sku="' + escapeHtml(item.sku) + '" title="' + escapeHtml(title) + '">' +
        '<span><b>' + escapeHtml(item.sku) + '</b>' + pinControl + '</span>' +
        (item.name ? '<small>' + escapeHtml(item.name) + '</small>' : '') +
        '</button>';
    }).join('') + '</div>' + pager;
  }

  function renderDetail(panel, statusText) {
    const detail = panel.querySelector('.pfh-detail');
    const data = state.data || (state.selectedSku ? loadData(state.selectedSku) : null);
    detail.classList.toggle('is-loading', statusText === L.scanning);
    if (!data) {
      detail.innerHTML = '<div class="pfh-status">' + escapeHtml(statusText || L.noDrawer) + '</div>';
      return;
    }
    state.data = normalizeData(data);
    detail.innerHTML = [
      '<div class="pfh-detail-scroll">',
      '<section class="pfh-section pfh-file-section"><div class="pfh-section-title"><div class="pfh-title-meta" data-action="copy-title-meta" title="' + escapeHtml(L.copyHint) + '">' +
        escapeHtml(formatTitleMeta(state.data)) +
      '</div></div>',
      rowHtml('packageCode', L.packageCode, state.data.packageCode),
      rowHtml('printCode', L.printCode, state.data.printCode),
      rowHtml('packageSizeText', state.data.packageSizeLabel || L.packageSize, state.data.packageSizeText || L.noPackage),
      rowHtml('printSizeText', state.data.printSizeLabel || L.printSize, state.data.printSizeText || L.noPrint),
      '</section>',
      '<section class="pfh-section"><div class="pfh-section-title pfh-graphic-title"><h3>' + escapeHtml(L.graphicSection) + '</h3>' + excelControlsHtml() + '</div>',
      '<div class="pfh-graphic-table"><div class="pfh-table-head"><span>' + escapeHtml(L.item) + '</span><span>' + escapeHtml(L.size) + '</span><span>' + escapeHtml(L.action) + '</span></div>',
      rowHtml('packageLength', L.cartonLength, state.data.packageLength || L.noDimension),
      rowHtml('packageWidth', L.cartonWidth, state.data.packageWidth || L.noDimension),
      rowHtml('packageHeight', L.cartonHeight, state.data.packageHeight || L.noDimension),
      rowHtml('productLength', L.productLength, state.data.isTubePrint ? (state.data.productLength || L.tailSealLength) : (state.data.productLength || L.noDimension), { editable: state.data.isTubePrint }),
      rowHtml('productWidth', L.productWidth, state.data.productWidth || L.noDimension),
      rowHtml('productHeight', L.productHeight, state.data.productHeight || L.noDimension),
      rowHtml('netContent', L.netContent, state.data.netContent || L.unknown),
      rowHtml('grossWeight', L.grossWeight, state.data.grossWeight || L.unknown),
      '</div></section>',
      statusText ? '<div class="pfh-status">' + escapeHtml(statusText) + '</div>' : '',
      '</div>',
      '<div class="pfh-note"><span class="pfh-note-source">' + escapeHtml((state.data.packageSource || '') + (state.data.updatedAt ? ' | ' + L.updatedAt + ': ' + state.data.updatedAt : '')) + '</span><span class="pfh-note-toast" aria-live="polite"></span><button type="button" data-action="refresh" title="' + escapeHtml(TOOLTIP.refresh) + '">' + iconHtml('refresh') + '</button></div>',
    ].join('');
  }

  function rowHtml(key, title, value, options) {
    const shown = value || L.unknown;
    const colorClass = /^package(Length|Width|Height)$/.test(key) ? ' is-carton-dim' : (/^product(Length|Width|Height)$/.test(key) ? ' is-product-dim' : '');
    const editButton = options && options.editable ? '<button type="button" data-edit-key="' + escapeHtml(key) + '">' + escapeHtml(L.edit) + '</button>' : '';
    const copyButton = options && options.noCopy ? '' : '<button type="button" data-copy-key="' + escapeHtml(key) + '" title="' + escapeHtml(TOOLTIP.copy) + '">' + iconHtml('copy') + '</button>';
    return '<div class="pfh-row' + colorClass + '" data-key="' + escapeHtml(key) + '">' +
      '<span class="pfh-label">' + iconHtml(rowIconName(key)) + '<span>' + escapeHtml(title) + '</span></span>' +
      '<span class="pfh-value">' + escapeHtml(shown) + '</span>' +
      '<span class="pfh-row-actions">' + editButton +
      copyButton + '</span>' +
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
      '<input type="number" min="0" step="1" class="pfh-excel-pack" placeholder="' + escapeHtml(L.excelPackQty) + '" value="' + escapeHtml(state.excelPackQty) + '">' +
      '<input type="number" min="0" step="1" class="pfh-excel-price" placeholder="' + escapeHtml(L.excelPurchasePrice) + '" value="' + escapeHtml(priceValue) + '">' +
      '<button type="button" data-action="excel-prepare" title="' + escapeHtml(L.excelRefresh) + '">' + iconHtml('refresh') + '</button>' +
      '<button type="button" data-action="excel-generate">' + escapeHtml(L.excel) + '</button>' +
      '<span class="pfh-excel-status' + statusClass + '">' + escapeHtml(status) + '</span>' +
      '</div>';
  }

  function uploadPanelHtml() {
    state.uploadExpanded = true;
    moveCompletedUploadsToHistory();
    if (!state.uploadRunning) {
      resetRunningUploadsToPending();
      saveUploadQueue();
    }
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
    const selectedIds = new Set(state.uploadSelectedIds || []);
    const rows = pageItems.length ? pageItems.map((item) => {
      const active = currentSku && item.sku === currentSku ? ' is-current' : '';
      const ready = Boolean(item.xlsxKey && item.zipKey);
      const status = viewingHistory ? (item.status || L.uploadSuccess) : (ready ? (item.status || '\u5f85\u4e0a\u4f20') : '\u7f3a\u6587\u4ef6');
      const statusClass = /\u6210\u529f/.test(status) ? 'is-success' : (!ready || /\u5931\u8d25|\u8df3\u8fc7/.test(status) ? 'is-missing' : 'is-ready');
      const files = [
        item.xlsxName ? 'XLSX \u5df2\u6709 ' + item.xlsxName : 'XLSX \u7f3a\u5c11',
        item.zipName ? 'ZIP \u5df2\u6709 ' + item.zipName : 'ZIP \u7f3a\u5c11',
      ].join(' | ');
      const uploadName = getUploadDisplayName(item);
      const retryable = !viewingHistory && ready && /\u5931\u8d25|\u8df3\u8fc7/.test(status);
      const selectHtml = viewingHistory ? '<button type="button" class="pfh-upload-check' + (selectedIds.has(item.id) ? ' is-checked' : '') + '" data-action="upload-history-select" data-upload-id="' + escapeHtml(item.id) + '" title="\u9009\u4e2d"></button>' : '';
      const actionHtml = viewingHistory ? selectHtml : (retryable
        ? '<button type="button" data-action="upload-retry" data-upload-id="' + escapeHtml(item.id) + '">' + escapeHtml(L.uploadRetry) + '</button>'
        : '<button type="button" data-action="upload-remove" data-upload-id="' + escapeHtml(item.id) + '">' + escapeHtml(L.uploadDelete) + '</button>');
      return '<div class="pfh-upload-item' + active + (viewingHistory ? ' is-history' : '') + '" data-upload-id="' + escapeHtml(item.id) + '">' +
        '<div><b>' + escapeHtml(item.sku) + '</b><small>' + escapeHtml(uploadName) + '</small></div>' +
        '<span class="' + statusClass + '">' + escapeHtml(status) + '</span>' +
        '<em title="' + escapeHtml(viewingHistory ? (item.step || item.skipReason || '') : files) + '">' + escapeHtml(viewingHistory ? (item.completedAt || item.updatedAt || '') : (item.step || files)) + '</em>' +
        actionHtml +
        '</div>';
    }).join('') : '<div class="pfh-empty">' + escapeHtml(viewingHistory ? L.uploadHistoryEmpty : L.uploadQueueEmpty) + '</div>';
    const historyHeadActions = '<span class="pfh-upload-head-project"><b>\u9879\u76ee</b></span>';
    const tableHead = '<div class="pfh-upload-table-head' + (viewingHistory ? ' is-history' : '') + '">' + historyHeadActions + '<span>\u72b6\u6001</span><span>' + escapeHtml(viewingHistory ? '\u65f6\u95f4' : '\u6587\u4ef6/\u8fdb\u5ea6') + '</span><span>' + escapeHtml(viewingHistory ? '\u9009\u62e9' : '\u64cd\u4f5c') + '</span></div>';
    const pagerAction = viewingHistory ? 'upload-history-page' : 'upload-page';
    const pager = '<div class="pfh-upload-pager"><span>\u5171 ' + allItems.length + ' \u6761</span><div><button type="button" data-action="' + pagerAction + '-prev"' + (state[pageKey] <= 1 ? ' disabled' : '') + '>\u2039</button><b>' + state[pageKey] + '</b><button type="button" data-action="' + pagerAction + '-next"' + (state[pageKey] >= totalPages ? ' disabled' : '') + '>\u203a</button></div></div>';
    const selectedActionHtml = viewingHistory ? '<div class="pfh-upload-bottom-actions"><button type="button" data-action="upload-selected-delete"' + (!selectedIds.size ? ' disabled' : '') + '>' + escapeHtml(L.uploadDelete) + '</button><button type="button" data-action="upload-selected-retry"' + (!selectedIds.size ? ' disabled' : '') + '>' + escapeHtml(L.uploadRetry) + '</button></div>' : '';
    return '<div class="pfh-detail-scroll pfh-upload-scroll"><section class="pfh-section pfh-upload-section is-open">' +
      '<div class="pfh-section-title pfh-upload-title"><h3>' + escapeHtml(L.uploadSection) + '</h3>' +
      '<span class="pfh-upload-status">' + escapeHtml(statusText) + '</span>' +
      '<button type="button" data-action="upload-history-toggle">' + escapeHtml(viewingHistory ? L.uploadQueueView : L.uploadHistory) + '</button>' +
      '<button type="button" data-action="upload-clear-list">' + escapeHtml(L.uploadClearList) + '</button>' +
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

  function handlePanelClick(event) {
    const actionTarget = event.target && event.target.closest && event.target.closest('[data-action]');
    const action = actionTarget && actionTarget.getAttribute('data-action');
    if (action === 'expand') {
      expandPanel();
      return;
    }
    if (action === 'panel-pin-toggle') {
      togglePanelPinned();
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
    if (action === 'copy-title-meta') {
      copyText(formatTitleMeta(state.data));
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
    if (action === 'excel-prepare') {
      prepareExcelInfo();
      return;
    }
    if (action === 'excel-generate') {
      generateExcelFromCurrent();
      return;
    }
    if (action === 'upload-toggle') {
      state.view = state.view === 'upload' ? 'detail' : 'upload';
      state.uploadExpanded = true;
      expandPanel();
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
    if (action === 'upload-history-select') {
      toggleUploadHistorySelection(actionTarget.getAttribute('data-upload-id'));
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
      retrySelectedUploadHistory();
      return;
    }
    if (action === 'upload-selected-delete') {
      deleteUploadHistoryItems(state.uploadSelectedIds || []);
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
      copyText((state.data && state.data[key]) || (key === 'productLength' && state.data && state.data.isTubePrint ? L.tailSealLength : ''));
      showToast(L.copied);
    }
  }

  function handlePanelKeydown(event) {
    if (event.target && event.target.classList && event.target.classList.contains('pfh-search-input') && event.key === 'Enter') {
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
      updateSearchClear();
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-excel-pack')) {
      state.excelPackQty = event.target.value;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-excel-price')) {
      state.excelPurchasePrice = event.target.value;
    }
  }

  function handlePanelChange(event) {
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
      skippedItems.forEach((item) => archiveUploadFailure(item, '\u5df2\u8df3\u8fc7', L.uploadFileTooLarge));
      state.uploadExpanded = true;
      state.view = 'upload';
      renderShell();
      showToast(skus.join(' / ') + ' ' + L.uploadFileTooLarge);
      return;
    }
    try {
      for (const sku of skus) {
        const key = uploadFileKey(sku, kind);
        await putUploadFile(key, file);
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
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
    };
    state.uploadQueue.unshift(item);
    return item;
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
    return compactText(fromCache) || inferUploadNameFromFileName(filename, sku);
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
      return {
        ...item,
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item),
        skipReason: '',
        updatedAt: new Date().toLocaleString(),
      };
    });
    if (!found) return;
    saveUploadQueue();
    showToast(L.uploadRetry + '\uff1a\u5df2\u91cd\u65b0\u52a0\u5165\u961f\u5217');
    startUploadQueue();
  }

  function toggleUploadHistorySelection(id) {
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

  function retrySelectedUploadHistory() {
    retryUploadHistoryItems(state.uploadSelectedIds || []);
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
      queue.unshift({
        ...item,
        id: item.sku + '-retry-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        status: '\u7f3a\u6587\u4ef6',
        step: '\u7f3a XLSX + ZIP',
        xlsxKey: '',
        zipKey: '',
        skipReason: '',
        completedAt: '',
        updatedAt: now,
        createdAt: now,
      });
    });
    state.uploadQueue = queue;
    state.uploadHistory = history.filter((item) => !idSet.has(item.id));
    state.uploadSelectedIds = (state.uploadSelectedIds || []).filter((id) => !idSet.has(id));
    saveUploadQueue();
    saveUploadHistory();
    state.uploadView = 'queue';
    renderShell();
    showToast('\u5df2\u6062\u590d\u5230\u961f\u5217\uff0c\u8bf7\u8865\u5145\u6587\u4ef6');
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

  function finishUploadQueue() {
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

  function updateUploadItem(item, status, step) {
    const latestQueue = loadUploadQueue();
    const latestItem = latestQueue.find((entry) => entry.id === item.id) || item;
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
    const latestHistory = loadUploadHistory();
    const additions = stale.map((entry) => ({
      ...entry,
      status: L.uploadSuccess,
      step: L.uploadSuccess,
      completedAt: entry.updatedAt || new Date().toLocaleString(),
      updatedAt: entry.updatedAt || new Date().toLocaleString(),
      xlsxKey: '',
      zipKey: '',
    }));
    const additionKeys = new Set(additions.map(uploadHistoryKey));
    state.uploadHistory = additions.concat(latestHistory.filter((entry) => !additionKeys.has(uploadHistoryKey(entry)))).slice(0, 200);
    stale.forEach(cleanupUploadFiles);
    saveUploadHistory();
    return (queue || []).filter((entry) => !stale.some((item) => item.id === entry.id));
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
        const item = state.uploadQueue.find((entry) => entry.xlsxKey && entry.zipKey && !/成功|进行中|已跳过/.test(entry.status || ''));
        if (!item) {
          finishUploadQueue();
          break;
        }
        await runUploadQueueItem(item);
        state.uploadRunning = loadUploadWorkerRunning();
        state.uploadQueue = loadUploadQueue();
      }
    } finally {
      state.uploadProcessing = false;
    }
  }

  async function runUploadQueueItem(item) {
    const xlsx = await getUploadFile(item.xlsxKey);
    const zip = await getUploadFile(item.zipKey);
    if (!xlsx || !zip) {
      archiveUploadFailure(item, L.uploadFailed, '\u7f3a\u5c11\u6587\u4ef6');
      return;
    }
    try {
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6253\u5f00\u5546\u54c1');
      await ensureProductManagementPage();
      await searchProductManagementSku(item.sku);
      await openProductEditDrawer(item.sku);
      await enterProductEditSecondStep(item.sku);
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6e05\u7406\u65e7\u6587\u4ef6');
      await clearProductReplaceUploadFiles(item.sku);
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4e0a\u4f20\u63a8\u54c1\u8d44\u6599');
      await uploadFileToProductField('\u63a8\u54c1\u8d44\u6599', xlsx, item.xlsxName || xlsx.name);
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4e0a\u4f20\u56fe\u5305\u7d20\u6750');
      await uploadFileToProductField('\u56fe\u5305\u7d20\u6750', zip, item.zipName || zip.name);
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6279\u91cf\u4e0a\u4f20');
      await openBatchUploadDialog();
      await uploadBatchZip(zip, item.zipName || zip.name);
      await matchBatchUploadForm();
      await confirmBatchUpload();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u63d0\u5ba1');
      await submitProductReview();
      archiveUploadItem(item);
      showToast(item.sku + ' ' + L.uploadSuccess);
    } catch (error) {
      console.warn('PLM floating helper upload queue failed:', error);
      if (error && /产品信息开品中|不能编辑/.test(error.message || '')) {
        archiveUploadFailure(item, '\u5df2\u8df3\u8fc7', '\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d\uff0c\u4e0d\u80fd\u7f16\u8f91');
        showToast(item.sku + ' \u5df2\u8df3\u8fc7\uff1a\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d');
        await closeTopProductDrawer();
        return;
      }
      if (error && /\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a/.test(error.message || '')) {
        archiveUploadFailure(item, '\u5df2\u8df3\u8fc7', '\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
        showToast(item.sku + ' \u5df2\u8df3\u8fc7\uff1a\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
        await closeTopProductDrawer();
        return;
      }
      const message = error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef';
      archiveUploadFailure(item, L.uploadFailed, message);
      showToast(item.sku + ' ' + L.uploadFailed + '\uff1a' + message);
    }
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
    const inputs = Array.from(document.querySelectorAll('input')).filter(isVisibleElement);
    return inputs.find((input) => /SKU|商品编码|款式编码|商品名称|PRODUCT/i.test(input.placeholder || '')) || inputs[0] || null;
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
    const label = Array.from(scope.querySelectorAll('.ant-form-item-label label'))
      .find((el) => compactText(el.innerText || el.textContent).replace(/[*\uff1a:]/g, '').trim() === labelText);
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
    return Array.from(item.querySelectorAll('.ant-upload-list-item, .ant-upload-list-picture-card-container, .ant-upload-list-text-container'))
      .filter(isVisibleElement)
      .filter((node) => !/ant-upload-list-item-uploading/.test(node.className || ''));
  }

  function revealUploadActions(node) {
    ['mouseenter', 'mouseover', 'mousemove'].forEach((type) => {
      node.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    });
  }

  function findUploadDeleteTarget(node) {
    const selectors = [
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
    return el && (el.closest('button, a, [role="button"], .ant-upload-list-item-card-actions-btn, .anticon-delete') || el);
  }

  function clickElement(el) {
    if (!el) return;
    ['mousedown', 'mouseup', 'click'].forEach((type) => {
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    });
    if (typeof el.click === 'function') el.click();
  }

  async function confirmUploadDeleteIfNeeded() {
    await wait(120);
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
    await waitUntil(() => getVisibleText(document.body).includes('\u786e\u8ba4\u65e0\u8bef\uff0c\u5f00\u59cb\u4e0a\u4f20'), 30000, 500);
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
    await clickReviewAndWaitConfirm();
    if (findPurchaseInfoEmptyError()) throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    if (!getVisibleModal()) {
      const filled = await fillMinimumOrderQuantityIfNeeded();
      if (findPurchaseInfoEmptyError()) throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
      if (!filled) throw new Error('\u672a\u6253\u5f00\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97');
      await clickReviewAndWaitConfirm();
      if (findPurchaseInfoEmptyError()) throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    }
    const confirm = await waitUntil(() => findReviewConfirmButton(), 30000, 500);
    if (!confirm) throw new Error('\u672a\u627e\u5230\u786e\u8ba4\u63d0\u5ba1');
    confirm.click();
    const result = await waitUntil(() => {
      const text = getVisibleText(document.body);
      if (text.includes('\u4ea7\u54c1\u63d0\u5ba1\u6210\u529f') || text.includes('\u63d0\u5ba1\u6210\u529f')) return 'success';
      if (findPurchaseInfoEmptyError()) return 'purchase-empty';
      return '';
    }, 120000, 800);
    if (result === 'purchase-empty') throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
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
    while (Date.now() - startedAt < 30000) {
      const modal = getVisibleModal();
      const modalText = modal ? getVisibleText(modal) : '';
      if (modal && /\u786e\u5b9a\u63d0\u4ea4\u5ba1\u6279\u5417|\u63d0\s*\u5ba1|\u63d0\u4ea4\u5ba1\u6279/.test(modalText)) return;
      if (findMinimumOrderQuantityErrorItem()) return;
      if (findPurchaseInfoEmptyError()) return;
      await wait(500);
    }
  }

  function findProductReviewButton() {
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    if (!drawer) return null;
    return Array.from(drawer.querySelectorAll('button')).filter(isVisibleElement).find((el) => {
      const text = compactText(el.innerText || el.textContent).replace(/\s+/g, '');
      const disabled = el.disabled || el.getAttribute('aria-disabled') === 'true' || /\bdisabled\b|ant-btn-loading|ant-btn-disabled/.test(el.className || '');
      return text === '\u63d0\u5ba1' && !disabled;
    }) || null;
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
    const text = getVisibleText(drawer || document.body);
    return /\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a/.test(text);
  }

  async function closeTopProductDrawer() {
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer, .ant-drawer-open'))
      .filter(isVisibleElement)
      .pop();
    const close = drawer && Array.from(drawer.querySelectorAll('.ant-drawer-close, button'))
      .filter(isVisibleElement)
      .find((button) => /\u5173\u95ed|close/i.test(compactText(button.innerText || button.textContent) + ' ' + (button.getAttribute('aria-label') || '') + ' ' + (button.className || '')));
    if (!close) return;
    close.click();
    await wait(500);
    const modal = getVisibleModal();
    const modalText = modal ? getVisibleText(modal) : '';
    if (modal && /\u5f53\u524d\u7c7b\u76ee\u5c5e\u6027\u4fe1\u606f\u672a\u4fdd\u5b58|\u662f\u5426\u786e\u8ba4\u53d6\u6d88\u914d\u7f6e|\u53d6\u6d88/.test(modalText)) {
      const confirm = Array.from(modal.querySelectorAll('button'))
        .filter(isVisibleElement)
        .find((button) => compactText(button.innerText || button.textContent) === '\u786e\u5b9a');
      if (confirm) confirm.click();
    }
    await waitUntil(() => {
      const topModal = getVisibleModal();
      const topDrawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer, .ant-drawer-open'))
        .filter(isVisibleElement)
        .pop();
      return !topModal && !topDrawer;
    }, 10000, 300).catch(() => true);
  }

  function getVisibleModal() {
    return Array.from(document.querySelectorAll('.ant-modal')).filter(isVisibleElement).pop() || null;
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
    state.searchQuery = input ? input.value.trim() : '';
    state.skuPage = 1;
    updateSearchClear();
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
      const targets = findDetailImageDownloadTargets(drawer);
      if (!targets.length) {
        button.textContent = '\u672a\u627e\u5230\u56fe\u7247\u4e0b\u8f7d';
        showToast('\u672a\u627e\u5230\u56fe\u7247\u4e0b\u8f7d\u6309\u94ae');
        return;
      }
      for (let index = 0; index < targets.length; index += 1) {
        button.textContent = '\u4e0b\u8f7d ' + (index + 1) + '/' + targets.length;
        const target = targets[index];
        if (!document.body.contains(target)) continue;
        revealUploadActions(target.closest('.filePreviewCard, .previewMasker, .ant-image, .ant-card, .ant-upload-list-item, [class*="file"], [class*="preview"]') || target);
        await wait(120);
        clickElement(target);
        await chooseDirectUseAndSubmitDownload();
        await wait(600);
      }
      button.textContent = '\u4e0b\u8f7d\u5b8c\u6210';
      showToast('\u56fe\u7247\u4e0b\u8f7d\u5df2\u5904\u7406');
    } catch (error) {
      console.warn('PLM floating helper detail image download failed:', error);
      button.textContent = '\u4e0b\u8f7d\u5931\u8d25';
      showToast('\u56fe\u7247\u4e0b\u8f7d\u5931\u8d25\uff1a' + (error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef'));
    } finally {
      window.setTimeout(() => {
        button.textContent = originalText;
        button.dataset.running = '';
      }, 1800);
    }
  }

  function findDetailImageDownloadTargets(drawer) {
    const cards = Array.from(drawer.querySelectorAll('.filePreviewCard, .previewMasker, .ant-image, .ant-card, .ant-upload-list-item, [class*="file"], [class*="preview"]'))
      .filter(isVisibleElement)
      .filter((node) => !node.closest('#' + PANEL_ID))
      .filter(isLikelyImageAssetCard);
    const targets = [];
    cards.forEach((card) => {
      revealUploadActions(card);
      const target = findDownloadTargetInScope(card);
      if (target && !targets.includes(target)) targets.push(target);
    });
    if (targets.length) return targets;
    return Array.from(drawer.querySelectorAll('button, a, [role="button"], span, i'))
      .filter(isVisibleElement)
      .filter((el) => !el.closest('#' + PANEL_ID))
      .filter((el) => isDownloadControl(el) && isNearImageAsset(el))
      .map(getClickableElement)
      .filter((el, index, arr) => el && arr.indexOf(el) === index);
  }

  function isLikelyImageAssetCard(node) {
    const text = compactText(node.innerText || node.textContent || '');
    const html = node.innerHTML || '';
    if (node.querySelector('img')) return true;
    return /\.(?:png|jpe?g|webp|gif|bmp|tiff?)(?:\?|$)/i.test(text + ' ' + html) || /oss-pro\.plm\.westmonth\.cn/i.test(html);
  }

  function findDownloadTargetInScope(scope) {
    const selectors = [
      '[title*="\u4e0b\u8f7d"]',
      '[aria-label*="\u4e0b\u8f7d"]',
      '[title*="download" i]',
      '[aria-label*="download" i]',
      '.anticon-download',
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
    return /\u4e0b\u8f7d|download/i.test(text + ' ' + meta);
  }

  function isNearImageAsset(el) {
    const box = el.closest('.filePreviewCard, .previewMasker, .ant-image, .ant-card, .ant-upload-list-item, [class*="file"], [class*="preview"]');
    return Boolean(box && isLikelyImageAssetCard(box));
  }

  async function chooseDirectUseAndSubmitDownload() {
    const modal = await waitUntil(() => getVisibleModal(), 8000, 200);
    if (!modal) throw new Error('\u672a\u6253\u5f00\u4e0b\u8f7d\u5f39\u7a97');
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
      state.excelExtra = { extra, excelData };
      state.excelMissing = getExcelMissingFields(excelData, extra);
      state.excelStatus = state.excelMissing.length ? L.excelIncomplete : L.excelReady;
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

  function getExcelMissingFields(data, extra) {
    const missing = [];
    if (!extra.englishName) missing.push('\u82f1\u6587\u4ea7\u54c1\u540d');
    if (!extra.ingredients) missing.push('\u6210\u5206');
    if (!extra.imageUrl && !extra.imageFallbackUrl) missing.push('\u4ea7\u54c1\u56fe');
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
      const imageInfo = extra.imageUrl ? await fetchImageForExcel(extra.imageUrl, extra.imageFallbackUrl).catch((error) => {
        console.warn('PLM floating helper image fetch failed:', error);
        return null;
      }) : null;

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

  function setCell(sheet, address, value) {
    sheet.getCell(address).value = value;
  }

  async function collectExcelExtraData(sku) {
    const drawer = getProjectDrawerForSku(sku) || getProjectDrawer();
    const extra = { englishName: '', chineseName: '', ingredients: '', benchmarkLink: '', imageUrl: '', liveData: null };
    if (!drawer) return extra;

    await switchDrawerTab(drawer, L.productTab);
    await waitForDrawerText(drawer, '\u6bdb\u91cd', 1200);
    extra.liveData = extractData(drawer);
    await switchDrawerTab(drawer, '\u8bbe\u8ba1\u8d44\u6599');
    await waitForDesignData(drawer, 4500);
    const designText = getVisibleText(drawer);
    const imageInfo = findDesignImageInfo(drawer);
    const previewImageInfo = imageInfo.imageUrl ? imageInfo : await openPreviewAndGetImageInfo(drawer);
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
      const hasImage = Boolean(findDesignImageInfo(drawer).imageUrl);
      if (hasName && hasIngredients && hasImage) return true;
      scrollDrawerBody(drawer, 0);
      await wait(180);
    }
    return false;
  }

  function scrollDrawerBody(drawer, top) {
    const body = drawer && (drawer.querySelector('.ant-drawer-body') || drawer.querySelector('.previewFormRoot'));
    if (body && Number.isFinite(body.scrollTop)) body.scrollTop = top;
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
    const images = Array.from(drawer.querySelectorAll('img')).filter(isVisibleElement).filter(isProductDesignImage);
    const ossImages = images
      .map((img) => img.currentSrc || img.src || '')
      .filter((src) => /^https?:\/\/oss-pro\.plm\.westmonth\.cn\//.test(src));
    const fallback = ossImages[0] || '';
    const original = stripOssResizeParams(fallback);
    return { imageUrl: original, imageFallbackUrl: fallback || original };
  }

  async function openPreviewAndGetImageInfo(drawer) {
    const preview = Array.from(drawer.querySelectorAll('.filePreviewCard, .previewMasker, .ant-image, .preview'))
      .filter(isVisibleElement)
      .filter(isProductDesignPreview)
      .find((el) => /(\u9884\u89c8|SKU_|\.jpg|\.png|\.jpeg)/i.test(compactText(el.textContent || '') + ' ' + String(el.className || '')));
    if (!preview) return { imageUrl: '', imageFallbackUrl: '' };
    preview.click();
    await wait(900);
    const images = Array.from(document.querySelectorAll('.ant-image-preview-img, .ant-image-preview-wrap img, img'))
      .map((img) => img.currentSrc || img.src || '')
      .filter((src) => /^https?:\/\/oss-pro\.plm\.westmonth\.cn\//.test(src));
    closeImagePreview();
    const fallback = images[0] || '';
    return { imageUrl: stripOssResizeParams(fallback), imageFallbackUrl: fallback };
  }

  function closeImagePreview() {
    const close = document.querySelector('.ant-image-preview-close');
    if (close) close.click();
  }

  function isProductDesignImage(img) {
    const context = getDesignAssetContext(img);
    if (/(\u4ea7\u54c1\u6b63\u9762\u6587\u6848|\u6587\u6848|\u4f01\u4e1a\u5fae\u4fe1|\u622a\u56fe)/.test(context)) return false;
    return !context || /(\u4ea7\u54c1\u56fe|SKU_|\.jpg|\.png|\.jpeg)/i.test(context);
  }

  function isProductDesignPreview(el) {
    const context = getDesignAssetContext(el);
    return !/(\u4ea7\u54c1\u6b63\u9762\u6587\u6848|\u6587\u6848|\u4f01\u4e1a\u5fae\u4fe1|\u622a\u56fe)/.test(context);
  }

  function getDesignAssetContext(el) {
    const box = el.closest('.ant-form-item, .ant-row, .filePreviewCard, .previewFormRoot, .ant-image, div') || el.parentElement;
    return compactText((box && (box.innerText || box.textContent)) || '');
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
    return sanitizeExcelFileName(filename).replace(/ /g, '\u00a0');
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
    const safeName = sanitizeExcelFileName(filename);
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

  function matchesSearchItem(item, query) {
    if ([item.sku, item.name, item.packageCode, item.printCode].some((value) => String(value || '').toLowerCase().includes(query))) return true;
    const data = loadData(item.sku);
    if (!data) return false;
    return [data.packageCode, data.printCode].some((value) => String(value || '').toLowerCase().includes(query));
  }

  function exportCache() {
    const items = {};
    state.index.forEach((item) => {
      const data = loadData(item.sku);
      if (data) items[item.sku] = data;
    });
    const payload = {
      plugin: L.title,
      version: SCRIPT_VERSION,
      exportedAt: new Date().toLocaleString(),
      index: state.index,
      items,
    };
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
        if (item.pinned) existing.pinned = true;
        if (item.pinOrder) existing.pinOrder = item.pinOrder;
      });
      saveIndex();
    }
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
      }, String(text || '').length > 12 ? 3000 : 1200);
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
    state.toastTimer = setTimeout(() => toast.remove(), String(text || '').length > 12 ? 3000 : 1200);
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
    const defaults = { excelKeywordMode: 'english', excelDownloadMode: 'picker', panelPinned: false, backgroundNoticeSeen: false };
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

  function archiveUploadFailure(item, status, reason) {
    const completedAt = new Date().toLocaleString();
    const latestQueue = loadUploadQueue();
    const latestHistory = loadUploadHistory();
    const latestItem = latestQueue.find((entry) => entry.id === item.id) || item;
    const archived = {
      ...latestItem,
      status: status || L.uploadFailed,
      step: reason || latestItem.step || L.uploadFailed,
      skipReason: reason || latestItem.skipReason || '',
      completedAt,
      updatedAt: completedAt,
      xlsxKey: '',
      zipKey: '',
    };
    const archivedKey = uploadHistoryKey(archived);
    state.uploadQueue = latestQueue.filter((entry) => entry.id !== item.id && uploadHistoryKey(entry) !== archivedKey);
    state.uploadHistory = [archived].concat(latestHistory.filter((entry) => uploadHistoryKey(entry) !== archivedKey)).slice(0, 200);
    cleanupUploadFiles(latestItem);
    saveUploadHistory();
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
      name: data.name || '',
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

  function handleOutsideClick(event) {
    const panel = document.getElementById(PANEL_ID);
    if (!panel || panel.classList.contains('is-collapsed')) return;
    if (state.scanRunning || state.materialWatchTimer) return;
    if (Date.now() < state.ignoreOutsideClickUntil) return;
    if (panel.contains(event.target)) return;
    const drawer = getProjectDrawer();
    if (drawer && drawer.contains(event.target)) return;
    collapsePanel();
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
    if (!pos) return;
    if (Number.isFinite(pos.right)) panel.style.right = pos.right + 'px';
    if (Number.isFinite(pos.bottom)) panel.style.bottom = pos.bottom + 'px';
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
      return { width: 880, height: 690 };
    } catch (error) {
      return { width: 880, height: 690 };
    }
  }

  function savePanelSize(size) {
    const value = {
      width: clamp(size.width, 640, Math.min(1180, window.innerWidth - 24)),
      height: clamp(size.height, 320, Math.floor(window.innerHeight * 0.9)),
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
    panel.style.width = clamp(state.panelSize.width, 640, Math.min(1180, window.innerWidth - 24)) + 'px';
    const main = panel.querySelector('.pfh-main');
    if (main) main.style.height = clamp(state.panelSize.height, 320, Math.floor(window.innerHeight * 0.9)) + 'px';
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
  }

  function makeSplitterDraggable(panel, splitter) {
    let dragging = false;
    splitter.addEventListener('mousedown', (event) => {
      dragging = true;
      state.ignoreOutsideClickUntil = Date.now() + 500;
      event.preventDefault();
      event.stopPropagation();
    });
    document.addEventListener('mousemove', (event) => {
      if (!dragging) return;
      const main = panel.querySelector('.pfh-main');
      if (!main) return;
      const rect = main.getBoundingClientRect();
      const width = clamp(event.clientX - rect.left, 110, Math.min(260, rect.width - 220));
      state.splitWidth = width;
      applySplitWidth(panel);
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      saveSplitWidth(state.splitWidth);
      state.ignoreOutsideClickUntil = Date.now() + 300;
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
      const minWidth = 640;
      const maxWidth = Math.min(1180, window.innerWidth - 24);
      const maxHeight = Math.floor(window.innerHeight * 0.9);
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
      height = clamp(height, 320, maxHeight);
      right = Math.max(0, Math.min(window.innerWidth - width - 8, right));
      bottom = Math.max(0, Math.min(window.innerHeight - height - 80, bottom));
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

  function getVisibleText(root) {
    return normalizeText((root && (root.innerText || root.textContent)) || '');
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
        overflow: hidden;
        display: block;
      }
      #${PANEL_ID}.is-collapsed {
        width: auto;
        border: 0;
        box-shadow: none;
        background: transparent;
      }
      #${PANEL_ID}.is-collapsed .pfh-full {
        display: none;
      }
      #${PANEL_ID}:not(.is-collapsed) .pfh-mini {
        display: none;
      }
      #${PANEL_ID} .pfh-mini {
        min-width: 58px;
        height: 34px;
        color: #1f3b67;
        background: #fff;
        border: 1px solid #cad3df;
        border-radius: 8px;
        box-shadow: 0 8px 22px rgba(20,32,54,0.18);
        cursor: pointer;
        font-weight: 700;
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
        outline: none;
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
        grid-template-columns: 150px 6px minmax(0, 1fr);
        height: 520px;
        min-height: 280px;
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
        background: linear-gradient(to right, transparent 0, transparent 2px, rgba(124, 58, 237, 0.24) 2px, rgba(124, 58, 237, 0.24) 4px, transparent 4px);
      }
      #${PANEL_ID} .pfh-splitter:hover {
        background: rgba(124, 58, 237, 0.18);
      }
      #${PANEL_ID} .pfh-list,
      #${PANEL_ID} .pfh-sku-scroll,
      #${PANEL_ID} .pfh-detail {
        scrollbar-width: thin;
        scrollbar-color: rgba(100, 116, 139, 0.22) transparent;
      }
      #${PANEL_ID} .pfh-list:hover,
      #${PANEL_ID} .pfh-sku-scroll:hover,
      #${PANEL_ID} .pfh-detail:hover {
        scrollbar-color: rgba(100, 116, 139, 0.55) transparent;
      }
      #${PANEL_ID} .pfh-list::-webkit-scrollbar,
      #${PANEL_ID} .pfh-sku-scroll::-webkit-scrollbar,
      #${PANEL_ID} .pfh-detail::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      #${PANEL_ID} .pfh-list::-webkit-scrollbar-thumb,
      #${PANEL_ID} .pfh-sku-scroll::-webkit-scrollbar-thumb,
      #${PANEL_ID} .pfh-detail::-webkit-scrollbar-thumb {
        background: rgba(100, 116, 139, 0.18);
        border-radius: 999px;
      }
      #${PANEL_ID} .pfh-list:hover::-webkit-scrollbar-thumb,
      #${PANEL_ID} .pfh-sku-scroll:hover::-webkit-scrollbar-thumb,
      #${PANEL_ID} .pfh-detail:hover::-webkit-scrollbar-thumb {
        background: rgba(100, 116, 139, 0.5);
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
      #${PANEL_ID} .pfh-excel-controls input {
        width: 62px;
        height: 24px;
        min-width: 0;
        padding: 2px 5px;
        color: #1f2937;
        background: #fff;
        border: 1px solid #cad3df;
        border-radius: 5px;
        font-size: 12px;
        outline: none;
      }
      #${PANEL_ID} .pfh-excel-controls input:focus {
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
        height: 30px;
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
        grid-template-columns: minmax(0, 1.15fr) 72px minmax(0, 1fr) 54px;
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
      #${PANEL_ID} .pfh-upload-pager b {
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
        gap: 12px;
        align-items: center;
        margin-left: auto;
        margin-right: 8px;
      }
      #${PANEL_ID} .pfh-upload-bottom-actions button {
        min-width: 66px;
        height: 34px;
        padding: 0 14px;
        color: #17406f;
        background: #fff;
        border: 1px solid #d6dfeb;
        border-radius: 6px;
        font-size: 14px;
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
        max-width: 520px;
      }
      #${PANEL_ID} .pfh-excel-controls.is-open input {
        width: 68px;
        flex: 0 0 68px;
      }
      #${PANEL_ID} .pfh-excel-controls.is-open > button[data-action="excel-prepare"] {
        min-width: 42px !important;
        width: 42px;
        flex: 0 0 42px;
        padding: 0 !important;
      }
      #${PANEL_ID} .pfh-excel-controls > button[data-action="excel-prepare"] .pfh-icon,
      #${PANEL_ID} .pfh-excel-controls > button[data-action="excel-prepare"] svg,
      #${PANEL_ID} .pfh-note button .pfh-icon,
      #${PANEL_ID} .pfh-note button svg {
        background: transparent !important;
      }
    `;
    document.documentElement.appendChild(style);
  }
})();

