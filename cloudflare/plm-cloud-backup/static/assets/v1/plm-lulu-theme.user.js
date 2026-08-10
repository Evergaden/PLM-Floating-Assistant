// ==UserScript==
// @name         PLM悬浮助手 · 噜噜乐园资源
// @namespace    https://plm.westmonth.com/
// @version      1.1.0
// @description  可选的噜噜乐园皮肤资源：暖黄主题、卡片趴趴彩蛋和加载贴纸。
// @author       Violet
// @match        https://plm.westmonth.com/*
// @match        https://auth.westmonth.com/*
// @downloadURL  https://plm-cloud-backup.wt196731.workers.dev/assets/v1/plm-lulu-theme.user.js
// @updateURL    https://plm-cloud-backup.wt196731.workers.dev/assets/v1/plm-lulu-theme.user.js
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const RESOURCE_KEY = '__PFH_LULU_THEME_RESOURCE__';
  const RESOURCE_VERSION = '1.1.0';
  const existing = window[RESOURCE_KEY];
  if (existing && existing.version === RESOURCE_VERSION && typeof existing.refresh === 'function') {
    existing.refresh();
    return;
  }
  const PANEL_ID = 'plm-floating-helper';
  const STYLE_ID = 'pfh-lulu-theme-resource-styles';
  let syncTimer = 0;
  let observer = null;
  const LULU_IMAGE_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAYAAACLz2ctAABC+UlEQVR42u29ebxlV1Un/l1r73PuvW+sV0OSysg8JEwhYZDBJAoKKg5gldh2N0MzyE8/NK0tYqv96inggIrQLTQojSIo1gPEEUS0KoggkDCahITMCanU/Ib77r3nnL3X+v2x9z7n3JcIop1Qr7j783mpl6r3Xt2693vX2mut7/p+gcmZnMmZnMmZnMmZnMmZnMmZnMmZnMmZnMmZnMmZnMmZnMmZnMmZnMmZnK1zVEGTZ2FyJmdyvvXO4uJl9rWv/d5zVBd58mx87TN5gv4fptz9+2F0EXz00OjJRSGv+PVf/+LjAiAnQJwA8L4A3f49Rg9cZgkAEXTvXnhagqyOql2DQd8NVk/kqqA9F11rFxcnz/W9HTt5Cr7xs3//HrNnz7IQLXsA+Of9e/Jt9sRs3rP5XUcH3fd/aXCmz8SveL6bCAoslwmw2LOsRJDJsxjOpFL7N0Q92huAt/qhy7+30+HvJuDRWg4fQKQLRCWNxGRis0E3M19hxo2F4FODrPfhM5/ykRtDut5jEngnAJycfz34FsG0BDnyvqd/+9ycWTJUfbvNHMMLUBWAVOFSQwCMATIDZAyYDF56J1xmP3Bk3f3a+VdceWP6WRMATs43FPlO/vnTXjRD8lZrio4flQJ4gQUpE0MdiCU8qwSAWWGMAAbGWIvpLpyZPTzk+VfMXbz8pwcWL7NXLF3pJgCcnK9T4S4y0ZIcf9+Tvmcupz/n/sAISs85DFgBIwATiAA1sbQjA2IDZQKUoIAC5E1vxvrp+WJtQ/Zsf8qH/yL97AkAJ+drtlg+9KGH5E87Ov+Z2dw/2pcjT5k3MAqyBCUFDELKJQKsAcgAzABbAAqCAlCIwJlOx1Z27q5D1fYnnP/U9x5CrKInbZjJuSf49uwxRNCLB2d+13THPLpYHwrEGRIBvEIlBS8FVJv3NVEAIVmQyQGTQYlBDOurymU9PXsb1n4yAG8PT/qAk3Pv5/87QgDQ6+eXs4EClaivoKJA+lABBID48Hn94QGtoFJB1QeQBnwSRiPtaPEd71y8rAssi36LZqMJAL/eORh+sezOgC+IKEQ9qaoAMC+A8wF8Ln7uPeBc/LwE3AioRoCvQOJBXghFRWz8mU99DHYSQfctfmsCcNKI/lce8b4CBKQOKhUAhVYMEg7RTwEyDCiHOGc5RkGuYxsB4V6oCrCBkjNTTDQZxU3O1z1l3rkFzKquJFYHSAUth9ByCFQlUBaAq6CuCv/v469VCTgP8h4qDuorqK8AEqjXla+s8DoA7Ns3KUIm597OvssFAIqpjYPq+sTkmdmDUUH9CFINIdUQcCW0LECuAPkiArIEyghCqUDiAjB9KTBQX/hrr3jRlSthMjIB4ORgfN6rulhfUc75oU//w2p/9d2MEa0eX5HR2jp0OAIVQ9CgDwz64GIDVAxA5QhUjUBVAfgCcAGQWpWAcyDxjMLThpo/AAAsY0JGON0ax8BFhOVlYA8AXKhES9qUoV+LxbyfgWuUaKme1V73wRfPnvvo7Q8crt1+9dr1X/rhk77sEJN24CjTCkYKWKlgCg8elTBUgUhDJ8YqYDg0qg1BTe55x4zp9wfL18z94N/qgWdYXL7kJ43o0+vfdA+gEQEiSkSk9wq8g4uGrliqx2Ibdy1eCuWnZTl/O4aDS9hgNywsqpEyESsB4n3oA4qHSAU4B0n3waoAymFIx64EVUNIMZIeKt5g+eJn0PnOK77/hmPpER/4+0V7RevvnwBwS5IFFpmWluToda+6dH7Xjp9XX81Rrock2/6e7syrPgyQbh59tZkp+rk3bvPnuR9CWbwYXXmcycwMxAFlBS0riHgwE1SBgGONPWeK89/W08kErd8KFPvUqgQlT3QCdvZm8Mw/lCje++k3Dj97xVIAn+p+Q7TXTwC4JVOv0sFbf7/zxOHVV0+d1bsQpgt0cwBdeMn/9Oj1t//47sf95hHV/QbYK8AeJlr2hz7/humFXcOX2My+wmR4OMRDhyOIioOClJSZw7RMI9ZAm2JtrCLC1JcaEGoMsUQAMRQMNgz0ukCew29UHt2pv0elf2A+tPu9tHevD3zD/XJv0XoCwFM8+t39hf/26AW78gkMRj2a3a40v404z8DbO8YV5ef6J6eet7D7Z25J4Nm4cemH8mmzz3b9YzBykMJ7ZQUITKSUohyQIl4kHaAV+RDAlb6KQFBQHRBV03Qu9giVFGREvQLGsJnpEQxDvP1MNbS/0l14xZ9+q0RDOt0YK4c//7KnLdjBR3Q46oF7aua3EW+bgZCtzPx05jx/+fjJ6nK6rtxYeDj/VsbupQDgh4UjIiYmVlKAFAQCIDGD0liGDYwXGgNfejoTOJvgSOEbEnDB8WsYCgJEvYJhZnoGYFQl9vsNfk1v9ytvCZX4kv+X2jSqSsC++MiWdKu1c06fKnhf+KUqsiNgGtnM9Lyv4FeOA+TB23dkslp4u808Ygcffb88YKqTTfUudcdHnghEhi1BoeojYADEDKiIKTRFwXvtXlH8So5ADYvBStzcDQkR1AmU8XNDhgC4/kCIoNnC7F7T46dWa7/7SqKXfkBVSZXamIYuLjL2XUtE5NtFl+q9F1qTCHg/UKaIoB//+M/MXjx19zVTuZxXlZVAlWF6MDt2gGanIOsDMWIYnMMPS8+ZMSBpAKcCZQIx1fUD3WNaRgAnxktMvRQiG8ZK8PhziGvg1RdH4vChOpa6AYIqHOddK3kmfjDcl2979S+H1tI+JSJtp+b1m155puOZ3XZuwc3cMnc9XfryapKCv8kgLK57wV/nVp9VrA7VWGIRA+52wN1p+JEB2Eqg6zETAwpp7msUZ7cMAAJiGo94FAsLJhCHFEpoVyYpBZsYQUMPMORfbUVDjiWLNuBMgCSGOFGA1GyfYzeyb856L/+vac+YaEnWbvm5R/R69ErK9ftVzDnUmVbqTR1YOzr4L9vOes1twD7aCkTX02wSEnh1HjgAAyIyCmYQSrhBgaovAFswK7OCQ8qVGOYMQAJCAa360GojhDU1gGpIvpRQru2suuktzaAEYnBzT4xRU2OBkpBKSHmV6gyvGh42MZGsDivblVdWg995E9GSYB8wuvPnfnqq5z5p580rDNlz2OQKVwmb6jt6+einQgq+iCZ3wPv9XKgAsHay+nC2wP+TM56CePWVELpz4LwLhq/vc6opbXrArcBjAWrOB5ODqQ4D1Qpc1gWbLoi1BSY0rZbWb6XPQ8GSCpRwMwzfwy3AUh0NqU7/sbBRgYZqmyA+8yfWxG6fe2Vx7PWjYvWr53UW5n8UfYX0pVLOLVkiDPrA0ROeCzoDALC8PClC7vf7BC2J7t9j6Cl/9KWNL73wz6Zmqx8bHBp4nj7bcN4DwTcvMACCBVACmqPs/TDy7U8EZT3cfbJEvyixvfg8tpd/CmQDqO3Fe19KmpFqlYoPjne4iNMEQk3xLkbPuoczBjq02NTaunPGRrchkpMrks90Xw27AL/a97BTzLaTESl04wSw2gd29rgSf2dIBpMq+JtTDF+zrKqguz8vv8Inhs/k7hm7OJ9WJokXNB9ffwZxCeVpFNteit7Cg3Hn0VW89e+uxVfWc1hm9Afn4pLp78ZPPe6DmNmZQ4VCpo73twQcpXjdoxQYKabWBkyqdc0b74TNJAVKkHQTpAbIIXYKCExKIBmKVz9NlMOQzcP1ob8KDAdAbgAyVJXyKUzYMN+8s7QEwcFFs/vid10jvbP+qnvmWaQiEhKihBdN48RCPAZTe5HNPhhfvvk2vOpPbsDfXXMM137onfjEO38R/ta/x03+Irz1cxeCMISmilW1CVhQ1E0PkdaARBrAITWvW01tDdFPBPAygHGrINeHFH2gXAUwhIqAVEIxRADIGTbMRNPh7x2uh7lzbpWnOqZyemSwNvh0eCcu6yQCflMq4f2GaK/rf+WXn9Wx/b3lal+NYUPwrYjEAIYos0vBs49BOTqBX/3I3Th811fx1ff+PO685cuYzglv/r19ePAjHoLFdz1K7jp2LZ29m0gkgredPtu9F5FQeyi3ui5ar4I0oxFAYWB4FSjnsYYnYKq3G7bbg67fAelfCc5PAJ1dgfpfly4SRnplBZRDIGcoyPNs18q6/9DZj/+/t2+lCYo9/fZ39/oT//yz5+eZe7shnhZAmFzIbsRo8edRdi/CbAf4q08dwnWHRzjykbfizlu+jDzvwTPhfX/213joP9+A666/m/GEnWHBSG0oSO6BvjTrTd0XCoWEtr6OqK6oAQu2I3z2hrPxN4d+CIdGPezsVXjC2Tm+86ILkE9fAjnxd6DyaiDvBGADdaObqAtkOUACKLEfOr+xQb8Lgi7vX55MQr4piqTL19INf/2mztTs4XdkmTvPrTtvM2MU6ZIWb1rEUPHwagH1+MrREihX0b/zWnRsBi8OrnJ4zWt+DgDwlB94tj9r1yXGDUqw0daeh7Yq3tDDC33DlJqp9eftx0oweYkb7rR43SevwMlbP471r34RM7segI9sezj+4fpd+IUffDh6u74fcnQFLNcBNA+ID+1DVcBYwE7DF+ve7uiYwfGNd+94yO/8YxxJ+gkA7/ezaGjvklu//sGv7fQ6z3An+44NWzCDmOO9SwB4KEIktOgDnINIwWShZODEgw2DDdAxFsPC4T98W6GMITwsEJvPaULCqa9HPNamSQVvjT3iCNf0BwU+dvvj8Nn9v421T78LogST5XjDO5dxZH4O7/74nXjZd5wPnfseYP0OoFvVjWrV8EZS6oqd9cYVuPv4UV2Kc2FMipD7n4bFREtu47qffU63x6/2qwPPxpgQmGLVyQw1BmoMiAG2HWTVZ4FqhIeduQBnZ3H2E58FFYE6B+cUw8LhPz//kXjpf3q09UOCsaG6rUkwteZBSLfN5FgjX1DqlB9Ak/qBHrAz+smDB/ytV74DJWcYqcGOs87Gi573TPz0M87F31+/ipsPrcL2dsLzIwE3QPqL45hQ2Wbw1q4O19d+/PxL3nJjGDFvLZkPe3rQ76En/nnx/M60/9/kSxIVkGFKbZFx+lQGqEBoGpneDnf8HbjioufgMVepfuYx/xnnjTIc/sz7/YMWCn7Zix/Pr3rJ48HOQZljYyU2oVXiXVBASq3+dBzNwdd9QqUWIwYKqAOIZXjrFwpjulPWWlTVCDfedCNe+IIX48LHPQHHBo/Clw+fgQftVsDuBLy2CIgUKvIOWP3M8a8OHvD34XnYevzBrZ+Cl68l2ksyvPHVbzI2O78aiDcZm1SpUk0U5YY0amx8LWfB1Y3obrwVr3tmTz91W6az338RZqopefhZ6zS/YwbaF0AJRGWoYyUBQaA+EU0JqjEZswkpXk0zS9Zm1KdE8F5h2JinPv6sqT9+TwHvCCKCzFj8wbveBfqjP8Gzf+VvUPpWMONIXkBYA2BDJMPK253bH/RA+JcQLb0xEm39BID3s2Ra/4aff1G3hx8sVwfeWjbUDhYa5hapbqBEJtDQFwR3IWWFs6Y3+Ace7QF3E2AyA2dQHV2D4dg/FBd6chI/hwfFpjZxECJSNiCTgcgCJgNsDmUbAM9ZUMwShmFA+gWe+7yH4M1vWcANN53A7HQedGSqEhdc8lRobwd29WIfR46GYBpbMTUzzBhCMQLDvOS6637t94BrNlTHqIiYsGHuQwY09gHHvjw4a34q/yS76lxfVrCGGIy6Gg3kUo73pthLUw2RRAUkFaAOIgJxVdjfVQeGgMRBqxHgKpCEhXJCWEIKvMGmCg7gszUI1XYBk4PyLjSfBmU9wHYBtlC2oRKeMvjc51fwgpe+H1+65qsACGc/6BF4wivejJ27zsFv/PBDMZ9vQNbfBrZFiBcqkWEdpy0enuemeGPVv3Bm50+/S3XREm2d5aatC8C4TLR+48++YabH/7042XfWGkuc6FQU56phKgGNEUsqkEiQ1/AjwJegKCAEVwLiQL4EvIO6EuSq8KtGLRj1DY0qjd4UodI2BkoGxBZqMsBkoLwL5NNAPgXNpoDODKgzA5gOvBLs/DacOLqG3/3jG/1VRx7NG+d8N+WdOSw+62xcfMEIbuX9MPYowFPh3glEBk98HgTCU1PsClx1/R3nPfWii/ZUE0Lq/RL9lvToF17z0IVt/CmMBnPeCxlObb6GlQz1IF9A/SiIBLkiAMyVUDcEuRHUBeUCeAdoVDAQB5UA2oYJnVo56ZmThtWSeIOG6waDmgxkMsDk0KwD5NOgzgy0NwPkM6DuLIR7MN0esG07/CjHV+4YomOm8cCzpiDlMZApAOTN1p3GaUv9eBgk5DE7Y/or9vmzZ/zEn0wmIff12XctEUGGN/ifsJa2DUvvmMWqAGxNeIHUgcRDqyHUDYCqD4w2QH4YlApcCZIS6oKmC6kLgFJXg4xUGoJBTRJolpNqRksKhSRhQhcrXhIXQM8MqixQrEGHOWgwBXRngO48uDMLX85B1tdg8w4esbsH8BBSCog7APXi40qXO2lVwgCpRl6OaKfrX37VVW/7AHCN3yp3QdqqrOdbr3rt7t3zq1/QcrTTlyXYggyHEEjqQW4EFBtA2QfKdVA5gJYDwIVl8VBUuHAPjFp+qqlRfC/PDqUWS/OaRs5eAESMuuF+xrFqbSpYJQo7xUk1NesAdgqaz4B680BnBtqZhWazQD4NznqxcjY1e7qh3GgzU1aCKimUVbsdrK/571zY/TMHt4oSvz31enpfb7NrPwN7/fZtxXPynHZtrBeeGQYSqEtBiaoIwBucBIp1UDGMwBsBUkShoDjg5zSfjeDTVplJrb0QhLluPdmtp3GxzweFas3Hav2cINlGCgg0tHGoChqCXILK8EbRfArUna3vi+jOAd1tAOeA6QBkwhuEuB77pSYnQUm8E9Ppmm6HXgrgYCLnTgD4Da5Vfv3NrmsUCuLrVn4EHCj3gA+yZw5gVwKjFWC4BozWw4cfAVoAUoYUK75u0YTXUONuUWjwJjJBw2BpycpoXOuloA1N2ubv0VhqDI1nbihZaGiEEIWKA2RYS3eg7AP5FCifghZ9oOiDuvOgfAZiukHqF4lhzXWBFQp9Yl0fwVr77EOH3vxAolfeshXSMH8zU6nqIof5ZWAzr970+ofd/onf7IXNL6XN1qe6GEB65HO/8JA86z62GpQEqVgl3tvKIXSwAu2fhPZPAoO1EF2qjXDvkwg+afh4JFpPzFS0AVL9uSashq+vfVgpUK7So5RxjilA8SpJoTHNDJAFYKEwUOUQwbyPmoIjaLEO2jgBXT8GrN0NrN4FrB2Crh0CBseAahhUVtVHRrbUWZlISb13dipfmKHquYjzcUxmwfe+TE0EJVoSLO/lwwcumykPvfp3p87mT579+PW/Wb3jlQ8NIFxk3b/H1JXvc/7SAEDOG5dYIztcVXlWELxAqwoYrEHXjwODdehoA1JuAL4AuQqoHFB5wGmj79wqbuEDs4lAoYipvyZFuTZtvgmI0Hb0SzshDIofqCOkgQojyOnbMBKkLFaxALyAnAOqEahYAw2Ogfp3A2t3Af3DoI3D0P4hoFxv3kjt4KYKFU+oSuQz9llXve1lGbDPn+q+xfzN2d0gPXBgsXv05p95OO1d9t0zL7wsm8VLaO3krOnkT5+a3fZ7N9zwpg4Apr3Lfnl5T0ZLS0KXXl0BQIf7jyfpA+KU4i4vRgPoaBB+HfaBchR0mn0FdcFPBj6Oz3ziCWgTuZq+WoOtGCU3f13Se9ExwTet73wh71FrgSmBPc2Dg3p+UtGHmnB/TNwF54ByBB2tAf1jQP8ItH8UGBwBBkeB0RrUFy2ygyTCjcGgVFO5p5z5nQ9+ABHpvn2LEwCi9tENe63HvvRfHvm0x47+buHs7Qer9V/6vyvHb5vG4aMFlQX7IxuVnZ3+9rPnjz+faMn1b3jhi5/3Hed/xn31Jz504urvuSA86upC+AoET+odyJUxhQ0gxRBSjuDLAlpV0MrH8ZlCJfI3BVCv4UO1BmPsujRi9hq+Dl4bEAKBfCBxLpzAFYuNuvBI90KJABQNRYyX+vHUIAaHdC4MpDeH1xCxyyEwWgUNToAGK8DGUWB4DCjWATcM0TAxrokg3ovp2Km5mc6TgvTvRRMA1u275xwyqqCcey+zU+YpenLlTDtjXjQ1x7+4duhQxSQG6hjlSLt29cdPXv0jz52annoHe/8Y0xs+S1ZP/DIAYHjyXFQjEFwwnnQVqBxGAI7CSM25cLfyMp5u4ycksYWXIo9GFotoTImR/a4BmIiRUaVVlLRTuEaLBmlHu6CKAI1Vq0Q1/bTroRJB2AKyxr8jvlkgEmR+R33o4CQwWAE2ToCGJ2KBVcTxXPh5KgIYh4yGTwUAHLyGJlVwOt2TRAQ9+dnVPo47kO86HB/xzvMufFRx6y3QSsDWG9koQRWeODOVL8vAKbGveHTCFGurj33BC9CVsrTo9QJoxAHVEFqMQFUJjS+yqg/gofCCtivdhiYfI1Dc7xgjMbTYy/VeR1p/S2mZN7VUa2wG66766+tsTPHvkNi/S1ONKFykceG93rRLUdcBTsK/p2bWcCP5ljOI81oSDlUJA3/xYqCqySQCppfoUcvlkVtfu3tlePQD1YnVI8YVVooBi2PJzzgXauP7wVeAGubObHBgq0qDsjTOuQq3AlU5zCEO4h3BlY0ms6/qNouqQOPVb2ySps1Sudbk0hZtPgFDW/u7dUqOLZrQ/AWk9oEbWz5q/tu6o6VoR9KwmjXRWVNFGyIoJaAmgPq4PleVoHIdGK2Fe+BoDVr2Q38z/nxACJWH6fKZL7quOpNoSU5lx3a+v3p8BxZh+3e/+he3b6tu2v2IB71l5fhdQz/oE6oCVIw4TRNUNDSJFWCbKVkDVCV02EdRjFb/4EqMfFFoLbonGpq6EXxhdhsYI4JG6iIFprqTXBNHW5n5HpUuNWuWYwDWthRMqw+IcaTX/UCNzZxm6pKoXeHr4j1VteWwFFNz+pkSf99VQLkBKvugcgMo+iED+DLtoRCcQIGF+V52ZrSA+NZNwal3d8uHfuT8rL/xi8ZqZqZ2PXnXIx6L6tgaLCg0zIiRes8qicPHBFFoVUKrIUj0OAAI6aiejokn9VVsLvtAItD4YqYeHjXCQGOipi19lnZqJRDA2my41Zk5Fh6MTSOx1uSDJDBjVGNfh2pOYltWVeMdtM7w1J78aUu/SMcnKyKBSFENgLIDMl0gH4HsVGjrBFMdZTHTxvB8+OZTtxC530Kzmd9WSVH00d8QWel7QUfN9Eyrsx+jhkgzpfAeVFWQqoRUDuqdVwW5qrobmtgqClKJ7CsB1/sY2gSiutDVugcNbdckWhcN1HoolKKmhMyW1jxqNlS7cGhHz5hi6+Ii6g7W6VgEJE3aDVE/FBCqqUKW5sFr+7mRaAtWhVaTD4QK9WWkaylBvLAh6ySb/ZZvRNPSkqjuMec/5W13Va58N0zFGI0UwwGl9EQJcPWLkirG6DykgrJwKAp3LhG0KPUaQGCYBPWyT3wxEdorzQuvkNhi0aYIbQ1DqCkqvEI0No8lReLWnS61O6RePRof1bTXhFM6lXSva/8M3bRP2kRsUol3Qg0X2LFKu6W1IJEwG73oqCrC3Vd87eApzuWneiV8P0XAZVEF1o6sLY3WyuvYF1aKQup3dLp8J8Jnim4RLeqF1ze8Zmwf/+eLC+cfXyk+7kcFFELaCkGKFhkgXe9bLbwQAdugDH+oSpvaNNT0+7TVG5SGrJDaOO2WS124pAJD9J5RTGXTXTFSrdIbiVqTDdXWOyVKycU3qiZnTlcFQ8T0hhUJxLDSwapuAAAuv0i/pQGYPHHPfeYHjxfSeZUXV2npVZxTdb6+iGuMFiq+1XjzUHHkQbJjNpt62Jn8379w08nPDNaLNcMwmnoX3LqTUdM6oVobsuHQyT2MRLSJhO2LX51mdbw4SYhsV6o10ls+wtoCmbRTaKv4SOEWm9Ju2inWZmxIqpt+TgrpwUAxUMwURMSibgApTp7qUm18/43flr0eWLRvfN/bPzoq7AezrjG+qHywNvVQL6AEPhGQl9Dl90FKLbMd0y+sAvjx+cFd29eq4d/a3CksC1kLIo5MaALXPTJq6PnUDCXS6xxeS21Vx007ppU0I/ZaEU7SGK5pPGuclqgPdzmSGLHqRrg0okb1FSN1TtIVpBXxUoSO90yV1vcGJker8JLA5pZA16dAj1kdQYIRzjUX6qQPCACXQ5aWIFVn+vWjwpe+cuwrH4gE3tfzWoqtFXWhomW2YGtBsDI7ZbJHnmt/5YbDR//YFQXBZgQTttLImKiCkPSZMe6TgHtmP5EYFeuxWDOaSxVy3V+OTeUEmjEt6NTbo4atT07CHDqCieKURVsRlSIXsdY7kgRUjYWKppFMAJZGpraXMK3xwZ+YIjdQRRQ5w29Uh+9cf+AdqiBaOnWX1fmbISC58PA3fV7Af9Sb6XA5KL1UMQo6F9OZj3ecljQuM9hYU/iO70xNPbv8yi2PWt3Y+FBnCuw5EzJZWAaKZABq6QG1U2eKeuI0tdsa03NRiKdxwrE2AKvFDnxkyGh7CsJNPzBJEcY+Iur7IFoVsDapWGquV+zktP4s/VH7Mtti4FAkOCiZ+BhJkVkV1c9deunLq4MHT21K1v3fId9zoaqCjM1+1aueZBaqSqdSVpAYBdU35arG6MHE4MyCTGY8d3XXnP3v13z62utQ+qO22yHNOgqThQjIADO1xL91/NpWv5baBLvU/00p2Tc0LG1RtuBaP6QmKfgGHL5J05TudtKOqi3ApXSaYmnN0JEWYFvUMZ8eaNKiSaLqFgQT77FK8EQl8r8DgMuPXjshpG6OggcPXma6j/w/1w+L7O29+Sl2zol4F1Kucw344r0oqBkYsLGwNoOxGebnujPFsRPP+9yXb7vRzHRI8x4oywGbg9i2LvGt6ra97hFfK93MK1Cql85KBxQSbGW8i4RVoUgSSNEwfURA+laPpx2t6jueNFO69pFYuLRHh7Kp+Gk3vUGBS1jTuggqrGyZXb88Wg31wKl+//um8QEvv/xKr6r01ZP6G0UhN3Y6GZelE/E+OFA6qWlLlCYYxsAYC85y2LxLYqb07DO7F3z1C9dcctttR5HPz5DPOuC8A7JZ2J2Ifh/jozI0chqtwCaxNSMS2zQKeK/4wp0eJ0eANQpVhkQCgza6Q3UPMfXf0vK4RgpWTTQQCRHUjxNe0+cpzapoQ5TY1P5RSu0mBtjEj0hwFe+pl8Or/MWuRy7dpfv3m1P5/vdNJKRCgWV+xBVvPzZw2VI2lYeBgFeId/De16lXYthiY8EmA9iATY4s71E+PaXnbKf8uo99DifWCuTbt0OzbpDFaJnDMNMmA5lm+iKbmtMpLTsP5IbwsG2Eq24R3HTSgJhgTK1IEMezGjc5wzRFYtRjCthYHRFuPK7wzUJJoFvVVXNrJaAe+KXJi44TXzWtAaQUnBbgO+EOCCI/1Gpwkt8JTOTZvg4I93rVPWbhcW9/z8bIfXB2+5RxlXcNYVMgEmUoYMBsAWNByECcgW2OLOvR9LYZzE0P8YUrr8YQOezCTqjpAjYHyIDZICkk1AJq7WmENtFGYovOx2VGJ4qZDuHpD7RY6Qv+4VbBrSuEDacwGcFYBgcOBdgQ2AhMbkAEHB0BX7pL8ZVjFc6aBbK67adNVd7m/EFBXsdTcGqEJ0KFBFlfogzgDMo5QF3ATEGVHU91TbVRLW9/3Os+rrrItHfvZC3z60xIlAh619X2VT2VS/PcnOMqL5EejPHFOIJhhhgTlKdMBmRdWBHsPEuwemwVX/qHT+OiJz4aU9t3wp1QsFLQdlEFcQgzIo0yfdu5KLX1UvvQa2gfOlIYVlxyNnBypLjpsMeth4FOh5BbwVxGYA5Uag/GSiWolMDwOHc747z5kK/FhYo1ycWFQqQVBmpLTW32jylSvkz8lVPFm4FMJ6xrmi4URsgw+0KOHl+VpVN9D+SUWkxPC9THrn7B8xY6eN9wfeABMZyyjCrEVfBV+KhGBVwZhu/iSkg5hK+GcG6IlWMb4HwGD3vcozHlPOTYndDhKtS76GruYxO6ae4mPl/bsa0RPIitl9jWMQzkBIxE0S8Uq0Ng6BkjETAxZrqKqUyxbYYx0w3MGPFcT2SIOPzdTA3oNDbK2xSdtgE2axA8otBqge0AnWmgNw/MbAemzgDyOcdzM3blePWihYv/9+9vlaX0U0YZIT1h/ate+FvTs/rf1o6uOWvYEjWjK3EVvPNwZQVXjCC+itT7AuIKVOUIzhVwpaAzvYCdu3ej5wrw+nFosQGtRpCqalo7KaXV1gubWM0pIrbl0KjpK2YGsEkI3wBgraOUIhQxCbj196LpoNT/c2+vBlFj7coENQTiDLAZYLvQzjQwvR2YOUO1t92ZbTNZ/8ToN2YvfsfPbCXwnUIADJ63tx5EfuauWz/QI//s1RN9bxkmsFwivcn7EAXLEr6qQstGK4gr4MsSImVMURY272Jmfgd6hmA2jgP949BhH+rKZk4b72Ua+XmiCE6Z7e5H3dNrkEQtkAZRygCUZKAJDlmz4fg1u8ShhmhFONWWoXWKeqlNSCDDQBbkPNR0gO40qDsH39uhNHeWmB3zZmOt+l8zj33HK/91yhITAP4LxFUwLUFu+uTzzzxvNv+ocaNHra8MvLXGpLmXiof3FSRGQnVhAC+uhPiGiEpsYG0Om3dh8ynkGWAHK+D1Y8BwLfLnfGx4h8glCJORRO5K10+Ji0ltcaKWv2VMrRpn0KhVWVtWcY0dIdM9wilFPs8YK5VaIGUDWAu1OZD1gM4cdGrB8cKZ1s/N6WhQ/ersJe/5H7p/j8GeZdlqhtWn1GV1//49Zu/eZX/Tp/7Tw86bkg9zUTxwMCi8YTY+7nkkhVJfVbFn6CDOQSObJqUtYzIYY2GMBbEBWwOrFexoHdQ/CRmsBlaxT+wVbcgoLRu3miyQbBl0nK7ffhZrfEHByYhwTCk/2rxC75HSG5Z1iqJRktcYqO0EuY5sWrQ3L/b8B1hn88P9yv3kwuPf+z6Nm1NbDXynpDpWusPc+fH/8LgzZulvyZU7B/2hZ1KjkQsnMR3XAPSBTaMIZSwzgYPfKQgE5gxsOQCRCOwL8GgdNDgJGq0Dow34sog5mMaY1JpGZKkBnVjTGJOLAfE9xLRqWn1bYwSGYrTUloVX21Q9rnIyg2wW/UByaD4De+Z5wNw2jMAfPLGhP3fOFR/4sh64zOLyK/1WBN8pK8+WBBZv+fiPftvZM/Q+40Zn9/ulNwQjkUMnEkGoAkl0rpgCazqWhs/BNkhlMNWbSQqCIQUXG+DRKniwAir6cf+kipOOpihJ4zmRRimtplcR1fNmjZKpYQJzzye7bSdCdVpuZNzCBMeESGmzqJQ1r7SwU3XHmV/oo/O6hUve/f72mxVb+Jyy/SI9cJmlK650h/5x76N2zWV/xr580PrJjYqZs1A0OEjsHnvv6xeemUHavn9Ro6UW6VKBhO3r9gcRYMTB+AI0WgcNV0FFH+SKsG3nJAgQSLukoDin3mwWh/YW09gzTDSm/BYelqGaQkbMgDWgLAPFVov2FtTO7qAy6534/GD9oidd8dd3q+4x+/ZdqEtLW8sTZMsJVCYQfuUT//Eh58/Ie3KVJ66e3PBEYqgmeEqMTvGib0zN4QNFMCal05oYmtwsI++wJSwUKE4Cow7khuCyH9J1uRH2LqoK5GJDO3ECNTqIREJrWsIb6+yk9os2y3FsOCjoWwuyXVBnCujNQDsz0HwGkvUgasCGfD7bwUD416Yvfu/Pq15mia50OA3OKd8x1wOLlq5Ycl8+8KM7L1jovKtrymevnVhzUDUUiXd14UCmAWHc26i7ytLsVKRlpagoFXcstLZybRsNUmQesAYZX3IF2I3A1RAsLuxkiAP5IJlGY1tEMecaG0XMLZTCXRSxqlXbgXAnfG5yxL0+SBSjzLo9mIyBjBVnnKWV6zyve/4bPng6pN8tI9GbxCvf9raXZT928fA3prvyyvWTK+qdwFhDqfUSFPIJRKHY0M37l8niIAGLtaF9+RDVtKFKQ7xrLTzpuPE0SRykS1wHTYbqAYShNRMZOckkJ64NCCwAhlBQWBhjVoNhsgxZnoHyDJxbIM+gWVcwPUXasYfLYf7kqbNfd1tb1HOrni0hUk60JLq4yLgLnl6+9F/XP/XC2zpTvTcUw5JEoMxMMJEJbWyNuSS/29gbcN08RtofTqTQLApKEuqNMxFfM5e9D/sX3sc9XiWIuPjt9+inxB0VagSOqO0Y7EHk6zeNyTIYa2GyDGwzcBamHmoJag3Q6YKyDouHN1MzZ+W282ZAfxDLe2kSAe9vS1bsYaJlf/yT//H58z1957A/zMMeGBPF6Jd6dkRU3+kopd0EvDjwVyJwclPSaEi5SVpDk+oUpLUc5OsFpGZxqXGyDDowkQ6Wms6mtTRlbQCbMSAbXDhhODouWZAxUMNxEpKHMRwZiFpvdsyZjaPFy2bO+sXf3UqWDKeHSj5AuOplli59e3Xyqhf88lxXf2FjvfKGyYx1hhMBAK1xGLVFg1ATBBLyxhrGtKl/p9ISXKYxDZh6Mtdq6FGSBEmjOwRyrMZSmNhAjY3FCdf9mSAtzUh+J4gGODCR+wcjnOVwWXb3+smZpyzsPnoHsE+3kjnN1jeqURD2LdL1z1nffn628aUM1VlV4UShTDWDoLmwhRFro17Q2K1SPXPjtELHHO6GY9yEpqpuboNtoG4adzDHCrgl98FRNZWptvgCNffWzW1slSgnl/o2Jlo7kIGKOt4xb4s1fXt3/tUv38pRcAtbdQUl/Y3rfvxvpiy+a+PkUBjg5OHWVhioV4SpFQmJ4riMGxJALW7KAXicbBFS0y7y9RK4It1fmep0j5rkQoFCVTt1AmNGw8wtPnDL/0MbSn+S6gAkVs15ICUoKxsWyTvlsN952swZP/XZrVqQbGG3zL2sChnd3LsOxn8XUalEAsQ9X6pnsTqmuUsp1aaxRFK65xZZoDaGTlEvkgJSpZoYK2kdk9sARQuMNLZ/0grHzZ3zXvRkgiZNkuaIOwNMgA+gJSYS58DTeS/r9P8HgB8Grt2SwWRLO6YTQcGd1SD4zRgLdek+xozawDCZ0VBcVkojO453suhMpGMFQfhcGc3vG1O7IWlcDFJmqAk2rRrXB9KHmmDZGhbnLYhM3ZIBxcUi4taHaaKwq6DFECiDvZiG9TwQs5HVDTHW/MDqsbc8mWnZ6/79ZgLA++3sAQBUDuV49dBsvY2BtQ2yMQoLaoASRe0/bsAQoqIBUQQOAniUbZgxs4l/bmoNQEogYg5AGwOWiVGsZcNVT02okQdJM2zvgfVjQDEAfBLgTMQZo6aX2Z7ZeIU2T8kEgPfnyQ2Ktv4LwA29vs2rG2O8t9JobLsoNXwqqsEQgJMq1/R3UA1y05p2mDGmgaLNPMA496q+/3EdyqleE426z0yAzeCqDcjoJOBHgceovtEQJGJZGylZec6RG3/toUR7JZBSJwC8/4oRw/Np5qubqO9JnrelOVpHmaYx3LqnpWHtplTeVjelmi5PGNNuU2xqRNOYa1JDgTEtbV8dj9xj/7AQOZ0o/GgtuHz6EuQrkJd4bRVS57ydNgszC+6H4j9zAsD75wTJMVZPUImRgwJXsFZHbQuxtYqLWlOlaRbXABhri1Dr+7hhnTK3Nva4ARNzTUpo60wnFYO4ZTU+KwZqMaJatCht6omHmd4J5zxksBaZOUEPUMWnZjpjMERm/d6rrnpbBiz5CQDvx+M8OoluleYOquNsUa2NXLgZxEU3I6rJyUlIvE2ib1oqYx7BGO/baZo7R7pXElUa19JoC1S2d5Kl0a5paYdQ/Jm2OwXJekAxCGwcX0LVNfayRIxBoSR4/EPPHVwavm3rpGHe4gEQYvSM2nYh2kOmiQK1yHdUi4VvckCMilQ6Rusbb0SPu2VSVN1v+FWJd1hHMTR6gOOiLjLuCZYmMq3HEYAndfubDAG9bZBqFNygfBmYN0kbMPBmvZnNKMfgOVvtdd26ANwTRHfYSScY96W+ntaRRJLzebsw0E1ORrVFK7Vci8ZEE+rLZc12RrTdSiSD5guDvjOSJkw71eq4qj7uRYG1peoa4rEEwsLUAtxoEHyQqyq4vHtXW0AAIFQOWdc8/cCBxe5WMCk8bVIwRSFuqqcUDScvGUy3JXZF2wJFTTO5AWpLpbe9pdRSlAnf2PLvqkkILRNDohaQWwBrDOQ2GR0miQ5psWZibJ2aQ+EBxCgYOIg+yhd7qApjUKqSf+wlD8gfEObCixMA3rdnn0by6fYgTatEqo1CqrZ3eVu+HtRWvd+UXtsaMjV5FU2US0Li2qROSqyZ+vfT1luaZkTVe7R84eKf6xhHEc3ILy21MwPeI+vNwlMXMugH21lXQX0VZHmhYAKJV7GGZ43RR+IU9wY5LQC4b98+irxQ0+xKNkLlkWxVK5WqthsekQmtbeOPqGyg48KRmrT7EuslqSqgJSgDjcTStixrcshErX4K8VF4MlXjbTOcTZrWMfqJCrJOF970UA0G0V29DN7CEh2XEocx8+Dp6uJJFXx/ABC1sGOGzfWDchNJQK12TBQHSgoHaEvhJnMQHYuaVEe7BpSUjAS1pefcAnetuqBtBXw01uotA5uxIkdbokktbWsiwOczcEUJrsog5Jn8QLTlqiQerO6x4Zuv0QkA71OS9JIcOPCCrhe3A5VryWZwM9dHEgZSKIKDZlI2CPIXUhsTJjXWZvm8JSQOacvlx6AXzXGSgFFtv4Da+4SwyZ6hXREngUrcs1jRtKuCprte5dNYW4kzYZ/sGNIbTKEqhMqBKjxgKzFjtioAFQCueMYfjgQIes6bfNa0pXfVTEMaNyaNDeuarKrtq/+mzXTFWGSkdsQSHY9w2gKrti0e2j9DxvuU0DG/EUpVORSUGahR7Bjl8HdbVOsDkJOxsU+Y5jDBCZj9rvXrsb3daZoA8D5YUgKAa974tGdnpT+nYgRKsyjEa0s2Q5tRW+3hsckgOhYCMmYc3VIlrQuFxqWosV9tLLVq/Wdp/T7atCqtpUXS12tUwyQf6f6MsAeSM2AJVDrg9kPQj92AqTsV050dGK5sgJKUSAI7IXAbRQFju6Ossz3ck0/9Snhr8gGXA/ftXN97cf6FO3prZ+TObutYdLuB/iQ+zFLj/m/o90rjO414T+SmL0NpQw5t9ioBEpvN3MyOm7tljFTUakG2yAVJZoOSDAdHQkPUrk5+nqQeqDwwLIH1EWh1BBzbAE4W0LVR0K+ZnYLzOYrjRzB3fhFTvAnagQg9T3ICdHt53svmk03r0tIEgP/vz95lgcLwO7rT7phDeesR8h0CzWeguQw0a0HTHXDXgCwgJkwUEnNZYs/PUKv7gdZVjLReNifEKrPmEpo6bVK6S3JSPqXAGaztEzalVxel98sIto0CWB9B1wugXwFDByp9ZLog6sMYaGYA52A1x/qKB5zUDBxqvasSAQKV6IQRfZ/yUKGLv39ZRqXMChRgQzpS+LUh1K+DjcLkBpqFdGamDLhngK4BchNkTnMbrO6zqEBlKMhiWNNSJ6VaLzCAjIMj+5hZtjT+Hl5C0es8UHpoqQFQQweMHFB4aOFCpHLJzh012NJmHGVmzK4rPabcZBDtAr0poDsTaPrJuDCxs4N4OU8AeB+dxUXQ0hL0u45tn6tyeZBUJeDjUlgWdHRFCVIKMAp+wiFIheXxsK8bnQ0YIBteOOY4d2Wu02VgTgXBaOJ2gRKijlTSjM/SFEQavzm0NuPGiLEpUmbc6vhwawqj47/nHCjLIKLgvAPMzkCzTiC1+qph0CigzvmCNooJAO+zBjR0aQmwOy3rSpEFinryVtOaCKjQyHY2wfejLkYDID0IJAQug0wqUVt0sgFRXREnGn+91E5NCqZA1yfikOprFkPz56HbQrV7e0qXmsBDSZqNGhIDJbYOheiqHnPzYTkpTUm0cuFrbFRhKMuiHK4cb6ZFSxMA3hd7fLdtHOk/ys7eToZ3FaF8DZmSObhsctxGg4boRtwaoTUTCopg4cTvY6rHcal502gNxqIGrSIDCsNhZyRETq6ld8e24IwZ4//VawAtrZp09yMwNJoTKnFroiNgdRKKJTCJh66ugKamoQyFJfJOj5/70OJw9EfRSQS8D/BHAE5m/YL83IoxFkxFUo+EV4nAS3otFAEYxIu4xf1jahbGaype0nRpKYsztbfsQu5ORYnWBQiPbdS1KNkNj7BWWlCod3E0rS0l9BgVSZreIccZs8kwqKAnDvd5ezGAqUYYHT0KU5Uw01OgIPKl3uC6nN5ebZVm9FYsQlTCk1s9/3fOOdzNMqiyQlwdJVLYcRLuaOQ0LrFxsPSjhnbKrdVc5th2iemQo5SGJJ85ppY1a2zN+ERkldaSesuak9rCQxjbw6yNYNPucVslTtJoMBYWHjqfAf94c/FLszcefUp27aFn5LmTbY94BItEFrjJyJXDg5iQEe7ri+BBBoANZ+6M0Uspzn7bem0UCwitnYYEAgqy0F5QeUHpBVUlcE5RloKy8igLj7LyKEqHKn64Kv3q4UoHX3n4MnwuVfAF1vSr11Dloolqtcl1ez+kpYIwZuPeHgUGvwd48dqd6dDDd+268g/f8InfH95+h87vPlM1z6EKIVKq+u7kXV8d/CUms+D79hysx/p8vRMGBf3degsuLQwFwmiacFDEQSCRatrzSOCsaYMhmqQ7mZdmShJMDD0E4fd8bWyotVxv+j5B45DZphQqklAmxomq4kO17TUaNbbY+yIgMIFzzHZ2rn3b47sPPGv3Anllp048FaXnKWJXrb/+4U9/68379+8xW2UWvCUb0W+59gwFgI0yu2YggyHY9NT7eo8i8fASRV9ra8K4OxR9QZJla5hiJTZzSzgcBJOApBoKDR23gaU4BqvZ1+nqyBTuoxQk2sI9MZkScxidpT3gRMtqTWL0HjsoDBgF5it0u/b9Q8XPL7hRF9UQyGE2Dh9+64uW/uiN0StEJm2Y+/DsX14WAnDdwuDabSeqYz1L5428CkG5iWBNHQvDTZojhY8O5GO76y2qVUuvHpKWMmmThIu2dkGSPUS8F5JSnKBQaA1BAQ8IpGFuJy8R5vrKWK90blpoij+bCm/cRseOvu1n+9fd+O78uTpyr+K1gZAfvXPbk/5iv+oig5aUgMkk5D6uhFUXF5lesrR++E3P/mIOc96wCH0YUgQF/XpNU8GSGsoCqdXs0TCZqS3nprXGtMS9Dro3u4V6m05aO8MKEkatBFMXwo0Deqg3Yh+QOYI+GRk2FKta3zBQ9ZWtIWUzEj+9FgL75z8E4EPjAugTcaL771wUCAmFzQ8a775X0d6/aDvNRBHz1COMnsCJSi8JdNosLTE3044afBqtGDisfXKKesnZUtP/BzNCEmpAKE1EY99aM1YBh/XyOKVJig26SWw/7BxThpMLthoQQQ8cgL386J5GKW7v1tSL3roAjFb0x0+6j83lWhpjMqlEo9hpI0LeIsVJW73US92qAzX+HjWIk8h5JJzWUmscois5icob3Izh0vTMSyO3oTWHJt4tQ8TkFA0hICYIhftm2hNJeoWa2LGWydvO8VuOnigA4PIr4AnLCkwker+paqmf/M0ndy/Cto/Zkbu039/wKt4AGoqC9m4uUV3t1n22tBhUdz60WQpnjqzjJr3WU4z0l6emdfoaTt29UPlSLHA0TeS0VVIYE/kHBGNN1MYPviFsgnBlmqoo1Jttc6bs5h/s/Nj7nqshPW958G39tczFy8xTfvqfhhuFO9AxJgwRqL2X0QJXVMNPouOqmz6k2e/wIhAv8PFDROCcrz+89/Di4L3AeQ/nBE4EpQv/X7nw9ZVzqKrYQ6wcqmg5673COQfxEpn80lL3bW3k1dcJo2DAucFREBTLexmnydni/5ArBQAG0/wnq847Zq6zWC3Rps1+MMcWTIr7GkWGApE59vQk9PVEPJKfawCbj46c6ddoFyYCIPyeOAepKvjKwbsKlXMoqwpVVaGqHLxTeNXWwvymJaa4/J7Yzk30VgAOI3E3AMDVH715AsBT4v6wFAZWD3nlRz6rufzjTDcjTVd+xdhOSN3lSKmUxzVggv9cbCrLprugBgtqBRwReVGIl0jCV6j3IuqdU+812YB5LxAfXNq996FxHfuTdXGR1gCicbakRaWWxEisQoz3kNLr9QBwyTMeJBMAnkJpGARdzfRd3M2bfomOb6FJLZ1BaFyBExslRDIRDy8eXj28cyjLCqOyREUENhnN5pntdTumN93jTi9n0+mS6eSweYen8p71sDRyomVMv+Id0pxWY7QU3077jQlOUzSFIkV9+H8RUUMEL1hZmeEvAQD2LJ82ANzyRicpuH36Xd+5/cF34yqzUVwwHBVK3rGqBDOvlILrgBKqYUljMo13O0kpshnD+Tho7U53h+iYd/hCP2ctRmWuUno7NADgqWcMHt8Z+JdVg9E2UaeZJaLaOtaAiGFAMMywlmEMwxqGMSZ+UChKoiprEiZSa7yd7pk+/GdnX/G3l55OBcgWFylvFbf795gnvWD5+B2/+vS3n9HrvH5jWIhhCk2+uLzdkmqpK1tmjSAM5jFCCpJgQOO8wIuHiDpj2d6xPvjtZ7359p//Gg/lT/7qpRcc3A3zQRI1lSc2Ji6gQGFqc5xUZ1A92kvNciWKyvzB1AbEoFLg53lU5eZNICj27zUA/CQCnmrmNQp88veevPDgI92rzEZxwagqlLwY8T40mpnaGr0tK5HoEScCL4hVrIfzLlSxThxl1hwW/r7ve9BtH/7KiYdkD336xQ4AlqNE3K4Lj9Dl1x5lWr62/MTLH/yWbZW+YlD6qtvhzETZXwPTingEywY2Y7BlsGEYIhgO1hFMQZHBGyudh2zntVn7S/Pf+6eLp4M33GkXAevR3PIe85SXLp/40uufuPiw2el3uRMeJcoQSTSqZiXqe1IViAWxIUA4zG8ZBEMWJQOqKt7BVl5Xs13+BlqC6OKNFe29Ue5lV4UVoD+z9rW+qJ47b/hMUVQEyhJ1P/S1BaRca86gEsCFubUzDpi2wEIPfNYM+JxtikeehzzH7eGhXks4zc5pU87T3mW/f88e876fe/Z77qbqF6SDFcukJKRwAnWAeIU6qfczGAiRxzAyJhhiWDbIjEEGC6OGd07nhcns7zzrt++8URfBtIR7jUBLSxAsgn7wd66/y83hVdPb8tFst5OpY7BQ48jpBUoCn3tU04JyB1CeRygfOwW9bDfssx6I3rMehqmnPQK9C3YHC4cV2yNADx688LQDoD2d/jF7l5e9Lu8x9JqPv+6Oj+25fVfp3rVyyxHBRkV+6KCjClRFk2sfGDH15IIVaghiCJ4VDqSmkxcnRF70pKWvvFcBoqWvzTKhJcgiwFe8+eb3XvXqh9zqiS/vnm0WLVOXMgZ3GKYbVkR5KkM200V3dhr5VA+m1wV3p4PPCAhwYaJnyELYKE7TY0+7f9GeZdFF8G1T53x01Ll7pXfRjm1V6dS4kuB84Ci48OqGZSNqlo2JId6jGJVqfEUDh/U758oDqqB9+0D4F6LfWCQEZHERfOnSjf8E4J+++J7Hfvt0Zp89cipZJ2ObGeSdHJ1eF3mnA9vJwVkOgYX4qBdtLDSxYZjAX/+vnQDwlKqKVfEAokODq370ytx2f2Bl2BfL1nA3BzHBGoTLPzO4pp4C3gXKvRlY1dLTcKNcOXFidpVpXCf164JwCXLV2y7Jbv7o1VKVvTeXLM9W76EeMJmBYVsLaSbWdrBntYANzphEDKnCNMawVQC4/PKLdHIH3ALn4MHLDQAUsAeNtSCwkrWAYbChEPkUgPMQ72s6PTHD5ha2m6EznSGzOPSiF105+p+L3/jzdMnLrnbXXAj981sPHdzw1SemppnVkNfIdiZSsGVQngNZB5pUGTg4LJGxUBvcmODd9vAPu2ZShGyFc/nRQNnvj+gLAwdPWWaIjWZ5hrzbDSDLGLZrYTsZjOXkrAVjGXmea7drkRtzBAD27Vv8N0Xiy3EZLy3dNhqy/UMYC/Wh72iIkFkLtiboaHJjz0VkoWCISLAdsRbO5wGAl09S8Ba5B+4XgCDd7u3Glke6PewmeLFGiW0wDERs9GqkUZH3QTatKgEU4NzA5tkKWmpc3/AbYelKDwBHT0x9cFZGv9YxbsY7A9GkuI/WAnvUC2Eb91jidl3llI2eE754koK3VH/95pvt4aqidcMcWFWIBoEmB0wHsB0gnwI6s0B3DtqdBjo9UN4VZLmaLq39+1cHwN/3k1fezbY6uGtbh0FUFaVzw6J0rqy8ehV1XsQ7kaoUqQpRV3o478iLAylJVW6crin4tIyAaTxHe9/SP/yJH/74zM7uw0ZHCyVkQgQhVYJE8SGTCAAexAzOMvAsZSgKFBvZh1ueOP+u89V+9WrydMZsL3/SdObIKoMdgysCGQG4CxgBpApxgQmwbIu7B8fLPv+fmILl9AwVp+FJJIV/+uMnnXHBjrnf6hp+Jtju6vUs8q4FWwasBWxW2yugcBiuj6CWv7y6Wvyvs5/5l29ZXFzkpaV/9/gr8f2zv/31B3/PztnOEzu97sOnZ3o7jdFZa5jzPEdmjKhh70HDsvR3a9655ugdo+VHv+Cj1yWH+AkAt9iMOHEQ/vqXL3nw3Lw5G6gumF7o7MyI57tdq5YB5wQKPTFcqw5X63rnTV+sbtz7zs8f1TG7mX/nY7n3KYr5sSdun56eU1oAMFgjPTk64d/9RRQAXEvM6LQE37fECYTob9y8T3XPfeE+Tvv3wxxYvMyq7jH1ysnY9YGgqqS6x+iBy+zi4ul6T/8WiIDYRBbYd9Ee+poG7MvNNIUI90fEId3sHdeYJE4i3uRMzuRMzuRMzuRMzuRMzuRMzuRMzuRMzuRMzuRMzuRMzuRMzuRMzuT8W8//D6efr3lK8qvKAAAAAElFTkSuQmCC';
  const LULU_SKIN_CSS = `
    #plm-floating-helper[data-pfh-theme="lulu"] {
      --pfh-lulu-orange: #f39a3d;
      --pfh-lulu-orange-deep: #d97722;
      --pfh-lulu-yellow: #f7d75e;
      --pfh-lulu-cream: #fffaf0;
      background:
        radial-gradient(circle at 100% 0, rgba(255, 216, 112, .28), transparent 190px),
        radial-gradient(circle at 5% 92%, rgba(246, 167, 70, .12), transparent 220px),
        var(--pfh-theme-surface) !important;
      border-color: #efd3a3 !important;
      box-shadow: 0 24px 72px rgba(143, 91, 30, .18), inset 0 1px 0 rgba(255, 255, 255, .92) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-full {
      background:
        radial-gradient(circle at 96% 2%, rgba(255, 225, 135, .24), transparent 210px),
        linear-gradient(150deg, #fffdf7 0%, #fff8e9 100%) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-header {
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, #fff8df 0%, #fff3d2 58%, #ffe4bd 100%) !important;
      border-bottom-color: #f0d8ae !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-header::after {
      content: "";
      position: absolute;
      right: 14px;
      top: 0;
      width: 120px;
      height: 100%;
      pointer-events: none;
      opacity: .72;
      background: radial-gradient(circle at 18% 38%, rgba(243, 154, 61, .22) 0 3px, transparent 4px),
        radial-gradient(circle at 42% 24%, rgba(247, 215, 94, .42) 0 4px, transparent 5px),
        radial-gradient(circle at 72% 54%, rgba(243, 154, 61, .18) 0 2px, transparent 3px);
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-heading > strong {
      position: relative;
      z-index: 1;
      color: #62472d !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-heading > strong::after {
      content: " · 噜噜陪你查";
      color: #c9792b;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .02em;
      white-space: nowrap;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-search-input {
      background: rgba(255, 255, 255, .84) !important;
      border-color: #eccd9a !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, .88) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-search-input:focus {
      border-color: #e8b76b !important;
      box-shadow: 0 0 0 3px rgba(243, 154, 61, .16) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-header .pfh-actions button:hover:not(:disabled) {
      background: #fff0c7 !important;
      border-color: #e7b568 !important;
      color: #c76c1e !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-list,
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-detail {
      background: rgba(255, 254, 248, .66) !important;
      border-color: rgba(239, 211, 163, .72) !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, .86) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-splitter {
      background: linear-gradient(to right, transparent 0 2px, rgba(243, 154, 61, .20) 2px 6px, transparent 6px) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-scroll {
      background:
        radial-gradient(circle at 12% 4%, rgba(255, 222, 119, .18), transparent 180px),
        var(--pfh-theme-page) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-welcome {
      position: relative;
      min-height: 78px;
      overflow: hidden;
      padding: 15px 116px 15px 18px;
      border: 1px solid rgba(235, 194, 117, .56);
      border-radius: 20px;
      background:
        linear-gradient(135deg, rgba(255, 255, 255, .82), rgba(255, 243, 204, .78)),
        url("${LULU_IMAGE_DATA_URL}") right 18px bottom -13px / 78px auto no-repeat !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, .92), 0 10px 24px rgba(178, 115, 31, .08) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-welcome::before {
      content: "";
      position: absolute;
      right: 88px;
      top: 11px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #f7d75e;
      box-shadow: 15px 14px 0 -2px rgba(243, 154, 61, .58), 34px -3px 0 -3px rgba(247, 215, 94, .66);
      opacity: .8;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-welcome h2 {
      color: #5b4634 !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-welcome > span {
      color: #bd6a20 !important;
      background: rgba(255, 249, 216, .92) !important;
      border-color: #e9c477 !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-metric,
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-chart,
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-panel {
      border-color: rgba(239, 211, 163, .76) !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, .90), 0 12px 28px rgba(178, 115, 31, .08) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-entry:hover:not(:disabled),
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-task-row:hover {
      border-color: #e8b76b !important;
      background: linear-gradient(135deg, #fffef9, #fff4d3) !important;
      box-shadow: 0 12px 24px rgba(178, 115, 31, .12) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-entry-primary {
      border-color: #e8b76b !important;
      background: linear-gradient(135deg, #fff2bf, #ffe4b9) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-entry-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #ffedaa, #ffd9a5) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-entry-primary .pfh-home-entry-icon {
      color: #bd6a20 !important;
      background: rgba(255, 255, 255, .54) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-entry-primary .pfh-home-entry-copy strong {
      color: #6b4a2c !important;
      text-shadow: none !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-entry-primary .pfh-home-entry-copy small {
      color: #8d633d !important;
      text-shadow: none !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-entry-primary .pfh-home-entry-arrow,
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-entry-primary .pfh-home-entry-meta {
      color: #bd6a20 !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-chart {
      position: relative !important;
      overflow: visible !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-lulu-card-perch {
      position: absolute;
      top: -68px;
      left: 21%;
      z-index: 4;
      display: block;
      width: 116px;
      height: 104px;
      pointer-events: none;
      transform: rotate(-7deg);
      transform-origin: 70% 100%;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-lulu-card-perch::after {
      content: "";
      position: absolute;
      right: 3px;
      bottom: 5px;
      width: 78px;
      height: 12px;
      border-radius: 50%;
      background: rgba(178, 115, 31, .18);
      filter: blur(4px);
      transform: rotate(7deg);
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-lulu-card-perch img {
      position: relative;
      z-index: 1;
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 8px 6px rgba(178, 115, 31, .20));
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-entry-icon > .pfh-icon {
      border-color: rgba(232, 183, 107, .72) !important;
      background: #fff8d9 !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-task-empty {
      background: linear-gradient(135deg, rgba(255, 253, 244, .82), rgba(255, 247, 226, .66)) !important;
      border-color: rgba(239, 211, 163, .72) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-sku:hover,
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-sku-waterfall-card:hover {
      border-color: #e8b76b !important;
      background: linear-gradient(135deg, #fffef9, #fff4d3) !important;
      box-shadow: 0 10px 24px rgba(178, 115, 31, .10) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-sku.is-active,
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-sku-waterfall-card.is-active {
      border-color: #e2a44f !important;
      background: linear-gradient(135deg, #fff4ca, #ffebc7) !important;
      box-shadow: 0 10px 26px rgba(198, 119, 30, .14) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-sku-detail-card {
      position: relative !important;
      border-color: #edc47e !important;
      background: linear-gradient(135deg, rgba(255, 255, 255, .96), rgba(255, 246, 216, .92)) !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, .96), 0 14px 34px rgba(178, 115, 31, .12) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-sku-detail-card:hover {
      transform: translateY(-2px) !important;
      border-color: #dfa052 !important;
      background: linear-gradient(135deg, #fffef9, #fff1cd) !important;
      box-shadow: inset 0 1px 0 #fff, 0 18px 38px rgba(178, 115, 31, .16) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-detail-sku-badge {
      border-color: #e8b76b !important;
      background: linear-gradient(135deg, #fff5c9, #fff0d6) !important;
      color: #c56d1f !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-detail-card-meta .is-design-type {
      border-color: #e8b76b !important;
      background: #fff4ca !important;
      color: #bd6a20 !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-empty {
      padding-top: 22px;
      color: #9a8064 !important;
      text-align: center;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-empty::before {
      content: "噜噜在这里等你";
      display: block;
      margin-bottom: 4px;
      color: #c9792b;
      font-size: 12px;
      font-weight: 800;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-loading-tip {
      border-color: rgba(232, 183, 107, .62) !important;
      background: rgba(255, 248, 220, .90) !important;
      box-shadow: 0 12px 28px rgba(178, 115, 31, .10) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] .pfh-loading-tip::before {
      content: "";
      display: inline-block;
      width: 38px;
      height: 38px;
      margin-right: 8px;
      vertical-align: middle;
      background: url("${LULU_IMAGE_DATA_URL}") center / contain no-repeat;
      animation: pfh-lulu-bob 1.8s ease-in-out infinite;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] :where(.pfh-section,.pfh-mini-tool-card,.pfh-settings-card,.pfh-upload-item,.pfh-ledger-item,.pfh-feedback-item) {
      border-color: rgba(239, 211, 163, .76) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] :where(.pfh-about-section,.pfh-upload-section,.pfh-mini-tool-page,.pfh-settings-page,.pfh-feedback-page,.pfh-ledger-page) {
      background: linear-gradient(145deg, rgba(255, 255, 255, .72), rgba(255, 247, 226, .52)) !important;
    }
    #plm-floating-helper[data-pfh-theme="lulu"] :where(button,input,select,textarea):focus-visible {
      outline: 2px solid rgba(232, 183, 107, .88) !important;
      outline-offset: 2px;
    }
    #plm-floating-helper-launcher[data-pfh-theme="lulu"] {
      border-color: #e8b76b !important;
      background: linear-gradient(135deg, #fff8d9, #ffe8bd) !important;
      color: #bd6a20 !important;
      box-shadow: 0 10px 26px rgba(178, 115, 31, .16) !important;
    }
    #plm-floating-helper-launcher[data-pfh-theme="lulu"]::before {
      content: "";
      display: inline-block;
      width: 10px;
      height: 10px;
      margin-right: 6px;
      border-radius: 50%;
      background: #f39a3d;
      box-shadow: 3px -3px 0 -1px #8ab744;
    }
    @keyframes pfh-lulu-bob {
      0%, 100% { transform: translateY(1px) rotate(-3deg); }
      50% { transform: translateY(-3px) rotate(3deg); }
    }
    @media (max-width: 680px) {
      #plm-floating-helper[data-pfh-theme="lulu"] .pfh-home-welcome {
        min-height: 70px;
        padding-right: 88px;
        background-size: 62px auto !important;
        background-position: right 14px bottom -8px !important;
      }
      #plm-floating-helper[data-pfh-theme="lulu"] .pfh-lulu-card-perch {
        top: -52px;
        left: 24%;
        width: 86px;
        height: 78px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      #plm-floating-helper[data-pfh-theme="lulu"] .pfh-loading-tip::before {
        transition: none !important;
        animation: none !important;
      }
    }
  `;

  function createMascot(className) {
    const wrapper = document.createElement('span');
    wrapper.className = className;
    wrapper.setAttribute('aria-hidden', 'true');
    const image = document.createElement('img');
    image.src = LULU_IMAGE_DATA_URL;
    image.alt = '';
    wrapper.appendChild(image);
    return wrapper;
  }

  function ensureStyle() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.documentElement.appendChild(style);
    }
    if (style.textContent !== LULU_SKIN_CSS) style.textContent = LULU_SKIN_CSS;
  }

  function syncMascots() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    const enabled = panel.dataset.pfhTheme === 'lulu';
    const oldMascots = panel.querySelectorAll('.pfh-lulu-home-hover, .pfh-lulu-hover, .pfh-lulu-card-perch');
    if (!enabled) {
      oldMascots.forEach((node) => node.remove());
      return;
    }
    const chartCard = panel.querySelector('.pfh-home-chart');
    if (chartCard && !chartCard.querySelector('.pfh-lulu-card-perch')) {
      chartCard.appendChild(createMascot('pfh-lulu-card-perch'));
    }
  }

  function scheduleSync() {
    if (syncTimer) return;
    syncTimer = window.setTimeout(() => {
      syncTimer = 0;
      syncMascots();
    }, 0);
  }

  function refresh() {
    ensureStyle();
    syncMascots();
  }

  function start() {
    if (!document.documentElement) return;
    refresh();
    if (observer) return;
    observer = new MutationObserver(scheduleSync);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window[RESOURCE_KEY] = {
    version: RESOURCE_VERSION,
    refresh: () => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
      } else {
        start();
      }
      scheduleSync();
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
