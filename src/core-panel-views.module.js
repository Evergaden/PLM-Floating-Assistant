
  function getWorkflowPatchCssText() {
    if (getWorkflowPatchCssText.cache) return getWorkflowPatchCssText.cache;
    const encoded =
    'H4sIAAAAAAAACu19y67supXYPED/g3IvLnpvp7SvnlWqKvSBGx5m2CO34QFLoqrko5JkSbUfLlygBxkFATLMpKc9zyxAgvxMozvfEZB6kRRJkZJqn3ttd8P22SqJXFxcXFzv9Tf/wcD/932RXs04zUGdZGfzAtMClsZLEV/MEIQXaMIoqfPSTMEHLO9FXiV1kmcHcKry9FbDY5JVsD5YxyipihR8HOIUvh9BmpwzM6nhtTqEMKthefzDraqT+MMM86yGWd09LkAUJdn5YAfF+/EEwq/nMr9l0aE8n8CT622c7Wa73by4/jP+NSrzwoyTtIbl4ZTeyqdd8f78099oLeVOgfqWRPXlcE2ypyCwiveNbVk/PB8vMDlfavx456DHIUjDJ/SbYRpB8f78fLwmmdm+Zh3RUGaUlDDE2Anz9HbNjvkrLOM0fztckiiC2fGUlxEsD3bxblR5mkQGXqXtuRvbsTeOY21ePOe5fc0sQZTcqhFmvo/j+HjK383qAqL87WAZjle8GzureG/G85yN42327ubFCZ6PYZ7m5eF7N3J939HE1JcLBBEsN4pvx3leQwa9CpRQFSCE5gnWbxBmxzMoDrZXvA+UgVbXIKHByymv6/xKYPF7COE+Ps1bnHFx71dQnpPsYHXI8mLXB94xzrParJI/wYO9Ld5/0hu20MPal6oAWQcIWrFl9OAEUeDsYxIcq3jXXK1xutV1nt0JqnUtAsuWYds9ikncRkEYxzZDk3uWJEEcxHEH79Z3dyHE8B6S7ALLpCaBR/OEt7LKy0ORJ4gkFFHbruElqcyiTK6g/Li3YHWIincO3FGQ7TwviIIOsjiONfFmVrcrnmmKqhHdIiLFnOCtBMUB/VeP36AjYume6sFE0oxZ4j0FtzpXHgWCMrxgimiYoL1HFCGhEItPITDawXiKQk4xGCjE892TD4QUok/e5imPmD0a8eeDbdgGQpCAW2POg5bYs238crd+p91BAzGkSRyjdRc9QKc0D782QFiG1QDRwob/TcF6Be/dH1meQQ7G4TaKY5+9J1w+yplLSA3ylost5OUd6vYIaw4LnhdbcdhRhB943i7WAs6o6jLPzneatWgOgU7QMMB+OKD7bQDAXm00M05gGlU0tmbutpg2d8Rh3CsstM5bwBDDbDa/hxBNpXzE8CAEn7B4JBnCXbxlSdIaiy6TYEtBVvrYRJsrJl2M4aoGZd0zbZJLq6C2meYr5LCclpX6PmKl4L392/Gs7m7g7q2jM2lH+N3Jbq4bkH28XWAJ+xNle+52q3vDDJOEeQTvrATbjg2s/fZkN/w7KN5/tF9c4zd5VuUpqDbXPMsxHzjW8L02+yFgmiZFlVSKMCCWUuZpj+FzmURHkghpno5+Nmt4LVJQQ7NBbXUItsW7cU2yK3h/sjZ2XD5jdKuIcxQURgVTGNaTMh39UZIVN91vEM5ACcG9JSTL+uEoP3rc+3fHURo4l+8eb55ntJfwpyHlzpcwdtr70qOLYKo+eaQRIkqID8ArLOskBKnmFBjg35UQRHmWfvz+TqHVja24Fy8DGHh7RQ5HD3+IkgqcUhjNpJb+exq6bezG+/7QAmCffDnXj2ANkrRi5/uiKwVTYq81EviPaVLVZlV/pFDC1yeAORzMN3j6mtRm+6J5BeVXQmhZMPIJxnkJ751Y87f/+k//+2/7Xd5ut5HDaIfHugRZFefl9VDmNajhkxXB83PzuDGZ9G8YL/a2MiCo9KD7XV7A7PcjGEcT7/HMk1SI1gaSDJZmndQpFN1kSrKz7mSPvMHYqfA9pnVvaUwR5resvpMqwnYwVHSq0J5VhiCEQQy6Ze5cfw9CYpmByiovSRqVhHjUy5zTwqOFLFj4P46KKgOvRf3Rr7E5zSN0DvIzvvQxa2iZgq4qB8syL0l+jvXm1jTid1pYbx05uR7wo3madGeyajeszouxWYkxO1l6Q3+Jkld6j9rdUMBK9fVmgigyW9NNN0qSpUkGTU1DayuHIrG0RSv+N4Hm5u/GmpDCuKbVX67kwbMNjcyVQtvQzrLwXv5oG39fJiDdVCCrzAqWSczeF3I2uiHNQOTjHgziIfOSZDtp/B8uiFsR7Bb/C0mbv30y7eK9t9t2CmQc+EhJJ1Fhw5CQw2LHOgEFOriC7AbSHpwpS/yfzCSL4PvB3S63ym8XWOWVFxQlIM3PIrN8Y38fmeW3waea5f2HmuU1UTVtl+d/tp6B3iEN9C7iyTsFA/28Za5hoZeOX+jY3Y+Y+XY304s3c9IvEqbe0D5WjUg1Sf/4KvNsdXs+5tl7FZ6tz9hoBKGLkxBD1fH8EFNwyypop5RcXWXAavReRqtvodo7BWswJCx9rP6qagMYm99ERngzBtck/eDZ4p0RyfvH/FajRzqb0mi5cR7eqjv3nuzGdBgu7HgbP9g47m7zYjsal8olyeoR21A60b76JDpq8W7sHJrpC+ID0elUlEH9qGwcFw2KDOQdLSJGv1PQb7BVZK/PAP54gzeOIqp9dH2ZE0fZnzJyWODTo45CWm9ynN4UIlCe8I9j7Ul5vjJ/ExtL+ebR1jKK2M/mZReXz4St9GWL/sbYUzD07BrLuapnYEQxOogt8zfjdB8bCQ5bq3FS6uv1nBmqK0hTkQF8dGT3Iz7i+gL79/HtktTQxCAdshxxAi3IGv93HsKqSrIzw01PexDAiMbtLnY10YumqG4hmoIZP9zDXWSx44dxoD0+VvPVRdhu4aCsE5AyUMVWZEUBS1H7GGgwvBrUt+reSVQVTOMDzKKjNu9zYDTYXEe2HfT6kv1vwGRJgLUtDaKb5VmnaM7w/faTY/vxFvZrc4PdyQvnjK259cSau92nNhruYdRz1ch3thNG7mkNaSV7kGyONniDYNGqrGa4J9ZlLTR4IrsVK8OwKgj+GWYaNNfMywtQspXCT1YPUBr7K2YuZlmkUgPSW4OLnaVNaC0Qg2uoXVOWIwkjzd9gdMwLECb1xwFJvd2Z+fUVRgl4GpzX/tYq3p/vugaqwQWkbQpqCYC07niEha2T0OTWa55aSFqxcUjKJ5tels/fDiQIaND1zkyyAEJfXX7SkYQqFUQDDwmiASOIOp0g+pMCX09hdIalCRIzuYIzbImxt4k61n9MrkVe1iCrOXLt8KPWVCWs81t4McP8WuQVnI6W7uDxKXgea631rGUx1OLlCiOqBaZb/xdrunUt/YhqMd6mmYnk229tzF1h4WtYdqcnWWbeXWOZv0xbr8QoiMZgpBMacfq2YCEWaXtub9gQGIWk14uNjvTmZeewF0zQBYbhzAO+6Wgw+S5ZTA3KM5SFTIk/bbNXJuIwNUKDV1jIhLGOb54j7UaKsd5TcBjJ9cxEW/Mt7XbQBWIONJOf/gDD2oyT+tBGdkwdGS+2YxXP7STYy2y208NTNix+lE0T6Dxhylq0Vl7alSKp7ElSsReSSptFkoITTKeszL0fRm5llm3cSH9bJFHK3Ee2Z9Gx4XM9Rhyz7GJvEekuWo6BFVxIc4D44y0Jv07ElSsLXIEu4cyDtD39HY5OewtEzDEnJ/JmUigx4diEg2OKqLizFQKYA2sLTpbIfLMfW2/mLwvFqa7gkApkDqkF4NFZRhMhgHJriXSKL/Q9xfV+rMHtminxceKsajA6tux3xnLw2B2hdpvgN+GQfNL0Y2fa6E8I0I7nA2uKT441jc5d1Pj+UPydJAZuSbzbwn0xqGg4mg+DbXBirJrckDf9qeukGGmKXI62qvq2rjdgcqLGJTAzKGB6dGEk6oJBeVZ7h7ba813u3zitWHVhn2bBFwOkZcaXWPFxwKTMij9tzlSy6EvMhKuY9ScMBVIDAJECtmeV0AVKMJHD6bjLxsKKLCnaO7OP/QrGRR13xfRoK/ks1DidiuNihjuBdlAha/beIq3ZrxfDNBxszyYM+8SG4pDmrcInA02NX5zppmiW8JaXX7FSQtIZ6YagpNpFU43ieAl+HRTvi8ZuAzZo5XMNaDPwyrvWPHL044rTVkkET6BstEvhuPPG4+TIuwvBrS+368kM8+KDn4A/C2ZyUKy10nLPIoCLEr4m8A3jI8nOHKj9mVAzI395GOgAs8ZO9lZi6RRJi4W1h1E17a4Wksh8nDThlXosjLLXVHUJ6/BC/Doy3YzeoJT49ZbBvlKUsAAlQJveXTXoJuNfDyjNdWXujeY3kSR1lyNSjCgshqFvkNN/cMC4W+QQjsu5NxgGDIURkCISGpS5bFsHycJZuNnlNn00jvz9mdoFQjxvBwh8ZfmcJ4pQQgLymQrkD4tPRLLP58hJDUMnQ5JH9tKWaLA07hZUzrH2zYE2S/wz5TOjdkZjogimsIZcJ27vMUBB3l2mpUMtqf+z0xOc1by80IsiHfPp/hRErcOnSefxcDpPp1IzVqdetdw5EgtUwLNABYwFqvu7HXJ4or0LXOtTFAfefsuu2o19JlO4W5E9U6ZawQOwnU3uJCBjiw5J54KgfdVoima6ElY1KjLAUu5g39nyzTvbcD8y74xoMoj9gSx3vu+cIpF5JxjXkNCKdRUsTNWMyUZVu1bIj6j/XQRqYKKb/e++a+b87vcUBAU4w8MFVE/UQ1iilGKQhfCZsWDg6xOxKoP3X5RdY85t18SBncB0IJEg/negBC1XRj/vZJGc0QdN1RlJJUN+HkoURVsdh6dve0GXWCKoUae7SrLW3o6KQ3D04iCw5Fi9JXV4GZt0PU4a/zSoxJCE7RMpHq+Q726dPB/Ky6mRYRPTFCXPMy4zzs23h65C3pY0+YUEgTQaDUtOQVHBQ/cPDnkQPp0bspY2BHpAwqPixEZ9GYJFqzoJv34ckbthCBR16CWhwj7hYBj3wW7Puo/Up54+fO2bEWkCJo6ZKEhwN4tHt5Mha65Rlx2HpqOX9jrRSw15oSDkEKbpgOgSpgCR98A6CNmY3Elaw1JcAZqQFxjLBm8gFZzHb0cllFr6txh6p5KxsIRWgBJmdU8dtrsNTxw+RsTuCTyPyB5zbEysjQViqggfu37e5rkw1ncI9iMiphSV4NxuDV3wCknkoDTPCDMwq5tKSBvEJuw43jQVJ+Nnem4y8BdHZxsuDhP9fhe6APKD2xEQLWCIqhA85yQ7c8+R4F3jV3cCyTrEhVePPsJO0Z6Y4+QdRgO7sL2dF7hbb9cHlePqkoJ7nYzS2AozOU974Mee/AbFETe+t3GDzX6/edl7z3Rk9b6tOtSE5rj2xrE2O2vz4vjPI8fZwFblsaatQGjCV5jVlSKNUmhEm/SaVMmJqYOlkkeWl9CM8rriaYYEPxkO/6TtQJaWIFAQSctLo04TT3jsjcSgpUR+/UKNhI60HC3S5dlH6Ie9xkw/pknLp7BCEFl4KxGH+w2iF52jg5YwsU2jy4H4rTtctmVZ40WLjFDMD3zDq9gku4wYBjzTUDBHhjHuJShxGmOh+ZfW5YeQLKluoo9re+oUTeGa8/ojcK1xzCbwTyu6xA/UXXwFWVLcmo2auUHGr+4c5qkzWB9bfIXZjbmNONvZ30tb4sehdDnFCrBIyTwdcoscdIsMPtQ35Br1OG7XkSVY7Fn1aKNpv7T3NtuI99sHCyFREIHcuK5qmJmXCYpiegXlk2livgqzW/t0gzFh1HnxPHsPOieP7L5hQBYfCLK6A+3MGkWvkZtECf3lFaQ8zFHB6IqmC0KYim9pWoUlhBnP5HJvE+14rOP1jcsiXi8MjTQfMN4Vsd+lE8+F1xn1CykR+/E2PlGf9QKTwnFUxklDM0xh9/UnQO9MScIq41xBgk0Qa43XVFVdbySzCss8TaUHTXzzTMlcC5Alks7WmIdeOpONKb8L15i+ffUCy/wuTd5ddy4mcmU/GS6wYKriLuI9K840vGrW+fmcQklMABHKyRXWO/M9VpcFLG7046Dq8fkeLgWO/ZDjHA7Hmrod5yGlBqfqPggYHk5e9pzXN1IooOrD4Pg1Dqp8CZ6gFYHY5eMJL9Xx/U33n5dg+yxCUF8JF3+1dTbefmNb+82L5T8OP510oanFrAlFnqcnwA9rnHkYehcI1a/E5mwiZeF0Ixg7wtuePSzSXfZm7LLHk1UPrRXjkai/0x6gxzAooePECawHURbK9VmRrAinRh9G60zRlBNBGItpaqtOUzsx58DRvK7FI6rtY1hHBESB2SUsIKif3A3lySRB72pxPgqwLxePKuCOjJPug6ZD0ooslohMdTW41EIGyauSwt572IXQU7jElMOzi4ji6FYGTi80dcFEIi/aoiGj7pr1+FSyHxHJA5Z1iJOyqpt+Aw9YIjk86wIlrQ3IkU0SUG8fFCnVIsnSbrw7jX/y0zA3FCASwYs9ug+Bhwguuc+RIIUZRbYrTil60D3hCO+Jn8Rw4gyNzwFTFI/zEC2Fti58ivRlb+mbWMFBVsJXWFawbTfZhbIrhRv5o3AjiTGUPw8vJ30n0G+pjBQ6r1TRPimL4xaGAgwWRTY0YKoyBlsNSzsCpIt1XimsUTmPrp90HMIojjzTG5ktrWKzvYRU88eJEdla2KJePzOSdulZ0LG9JuPirnEcO7FHx7POHB71M/tgKsfGILa7wR0Y7Hy1yNRh8HGSdtMSjS1pMy8XgaoBpXVN9EUYJOFlZEUGrVSEhWBth+ZGFhn0oxzvpkViKFA+hWeYDbFcFlJ5hlgyzz/t2JIuc/KYh+n49XbIeHw+i3OJbqxusAfB7IMlyuXYOfJOgfwwUl+r22Lk+X6btY5oH7Vb9BX6LUpW8NA2CpJ5Ka5EGzV3YH/yWRQESj0AmAlV5QNRUm9/ppQFBz4AgmS56YbppwB4sTsVZ0yVxdg6rhPG0soGbATUjEoHnNVR5Q2kXdNnTqBatUB5+I7+xsVAtt5u1E1h1NljZiITDoW+RUndNqfjJZ6IFVE39vm6aBNvaOH/t3tXx97abN1NsN+82JPmOCWYCzAq4x/E4QkIHdJOfIo9YmZK98EeQNc8gegMWyccdoYQGf2kOc2flJGC/q+2HyiKGBDP2dSBZyvTB/EOhozsIh3iDZQZitmUvtTuNl1tPhgmaiUw6RhpjpODWTnOi/pC+nvUCMRVp81uCry7GtWfhCHFpIgBoi0IprMkQNwfvV2wdV0wUYdHb1HDHtPNLXZRHNoMI41PsTts/M73djMmm+pIIPqupaLRdXiyT6EkE20PPct3NeEkpGvdL7HmQoUFKLafxLfre81Ed3XlrFUDvEgS5YZnOYw5m2icTrt7+ATOeAt8UQyTzPcyBGTVF3hFxWTwjjZa5Kbtq/I8GoHMOuGzU3bg6lbGIIQbRBJiFw06osjsO+odSDq/W3JiZ0A7tmkTVMi3Z+z5F1k0GVP0SS1ubIR4ImVBiN1AE7kmSOsNakwTxOF8fJHyGNcwxCyNlNF8SxQGar+QNmDGZKMSBDp/G3nZjvp0L8Z+K0qaVR4j9ONMj2n0d19h4DYoeWwbBQvotjUAjmsjrsJG/MY9aGx5zrlRHhQfu5vvoyCCEKy0SNrUpY3eGfQ8D1hWtUO2EhLnCxzE9PWxCDwdizEv0Ge9O2WnyvUedO4m+d9ekVzWYmXcjRrnmAkWumnD0MaYYbyFs6vdKBXmIX0C+vcRUa13GcRNST9Jb2dLwPQxzOY1eX9KMqMqz6fNFL4NO/hhQ1zzmmyPj+vH3WJKAtrQIWQGPhzvh824J/QqaNGp+scr1KSA1Zm3lxRe4+IqHx6Oe2fenTf3amNX0lSim4tyzXUXgiVfbzWMNt9vkfp1ehjXCNO8gvorHUrqLa1d9kuTXVcltBE2hxINC/HaXKLIOvvUm2yf5ciW3Krf6i4eFZz99DtidYVcvLg16rt+Brcf1TNWZPWc1gvf9gyOFlLMwn1T4HLep+M64Z99Dazfz2gmDc43Aq3Rh+VhQC/kKCvv8rju/xJ28xd+h081U1gBtSoGvl/Ava1Yg/8XsDKqaN8nKldN2cs/cy5FLFXjBDEu8qGO0LfiSmvU4NZYOb8ctsYAGbjCBZarxVoQWyt8/tq/6H+fX4v6m2rg3RKqGpzhCiecrZllez4qmqUiU41fgmGeRQOto6iMGCw1bC0ogs4L6PoLlT5kuORq/3MR/OdhSuijez/vDp1XorwN5v22xMXE+n4b/jiO9P0zl3+UAoM1Tk0bO9x++A39PFORqr8wXtI63No4QEFEwlSEjePQzvnlRQJtfp0Phw620aNscTjLfIzhHCFxKa+28hsTJzZ/us6zJKpxuDzKgtNzRSFqyFtndX0QoY8TYa1lTIyTWi3hbkxn4JW2CzfdEe1WWwgbFVP2FehafkdNBD3IFuvNXm27TrMqkiwjKncJam/Sx4AokE4C3VeF5MbmuX0Ay7p3wNBHcwbvllQGBVlybcpVijFnvOwro9F1jCSLkyyhwldnq6ETXJ2s9eDrRbIuZ/AqjHxFgid4/wicpfidOhRDk5Ux8TNPMd5PoEoq9peWxtqx+NfJr7/Cj7gEV1gZYojudX7vKz4eyrwGNXxyt6ga9bM8Zfrz2kcIMtU1dgplopvVBRLcVymij5pZ1qBLgaj5YoHmGlDxPIGAMWOk6ZpiSMh7nkTTZMWDWVs1op26BNXFhFldfgzRBM/s1yi6PwkB8td1WVsz0TRMN1EdeNiQXcC905wRJfB/Wc5I+ZHA1mSNMKHKiVuRSJIJLNXITz19tGX2uyjYAr1IT4mIt/WVQj2J3lE9azReHKcywtspCc0T/FMCy6cXZ/MSbF6cjf28oXtMoVdHPab6h6OX+mC94eFSgh21plSNfyV6aJEC26g3xlIAW/ffcPXgfyGu8tsn06arG2uZQXdgG3vf1gxKRV+iupBIjRqdsOaNZm4cYbm3N1tnYwfW5sW25nJPHovUsyP/vBDI5p0+zmOF2GrZVA1cesEOQ9Gb0xYlFAjgk/LEdiwcckobCgQNXmkzXh1oboOWNbHAb+P16XjYjWwK4qrYSCWfdVV+EjLNP95g+UHWPuIocE3zLmeu7QmVnLyPsU/1VMMFCecdGVynaiS/aH2PqyNKivuhXWREeF5ptjlUya3wwJbcbWsDCWymTE+ONnuWg2mXLfo4u5y7KJ1RUNIdfxqVedFSHfuz7maxj8wI1LO89Zwu0GwRijXBDPNbNuFYD8DeA/DxmWtyQLvug0yDvVlTsOVAGUWH6cgkZdjybOTx1d+UQZwqOK23FBxOU2M3M8wiIi0eY8lVTouTCUujcAVXFq7ACVEY4hhmSoP0Ss8wgyUg4ocm1qrmnlJcJVdOE+JijeXGSQbS5E/Ky+0jQpBECoJd8KhtZSNPcC2zBUumZUwcTddIAR7XGME8ZU6jPfP+xYapSXsewxe0U2GJyYzTXeinov0ZjoDb0tYADR0rqVO8Oo44pGPnOlf3JUhAA+BqGSo9Mc+kcxp1e+zEDlsokNgCOY9XnIKql6Ny61E7tJ+JAVBVyTm7wozqsMvzWU6CMHcTmix6KgE7mLj+NBoPp0TJvtnCVhucoNS2GPaJ70soUxgOMQ0DCqtGXdP1oP1Ct3pwxoZ3/i+ieqqyih5CetJqKE0gWmZR9zqLurct3jeIg9JNw0StnwadeIG1DjVfm94Hsoce169LtLzjOnyVd6uHXF0SCNMk/Iqrqw+GRgZVhLFXx4hLGW0DsdF2DrCtbZSnnAqX8TATXwjKqLXUSS364vpAuEvBHAvoZkoD2DtcqWkOznHBSNzeroAKN6r8e3YD6Sacwj1cgWg4sqCEZESK/gDIqED5bissUC7yuM5wrSp0WSaccwSHEfWDYjjJDFeK6B5W2il1ghq0Fj7akPQudIir6ee6uFiuY0zP0dQluAsv1w5+XMpCc+wZ160bIN8348Pmhj0Krc/TcLWy44IRukVxIRNVnSVn6A/6j78y/jOEhVFfoPGWl19PMAsvRmt0rgxQGXkGjY7ho9cy41ZB/H5cQhgZGAYjzkujfssNdGtUL8avflSWNvpZW64hiKLktiXUEGqYab4IeBZbflLJ2qpeUmvCqb6SvVbPuwCz2gRZeMlLtRiZQb2XsnKtfVTo0ti0hBrbGOd76oaFL4hWkl9nM+H5IoDlLnEPIIrl9u76MyZYCk/C3miqAxC9ogRkOoF+r/2P6jZ8IhJxrhO30wodR7Wguw3lKWN9YNoOPQxEM/fB/tG0Z4/FdWaMGVPzRHR+dcTh5agWxj3OgmfppLqXSHsiGrM7tyqh2XRTZ+S5JWr+TMVtELpl/uMFkaM72gQou0mEr6GsqerwHbZ9Ywn8O+O7ztLW/u93wlNYwjqkmoaTjf24ZhlBr3jkrjMYc2nXT4ffBnDJ9YJpZ4UgRab45aKCegy7FbczlWQYNTUkml07FCAzyQZyYouUx7NIeRyLlLskjHB0RCjeOTh6cBof+nNS2uPqJ0Q9/jF9KiRnLV1Io8UOK8F/i+CjbzGqszKtUskYCK+xXoOarShUfMtVrzmvC34RCyrkMwFnK1LkfhaEvIhF9fVii4WNQ+Up/yDeq55eFbPwbCG1SQvBKRgilUqKYu6xIfqvaexGh9Jx4PRDs78JDBjJVZyoqLPS0x9gWJtxUh+QwEGzn6nFajCPBvS2CMFyLxw13M8LF4qww2tRfzyajrWT7WatonmehL3LyuGyWZH/Sf/iGXv+50QZSrx6bQ+yKaTzr2cx81gp7n8aH3R0wgwxnh8acW/TR21Fq1SvRwX01k/apRpJlZt802o59G9YvulHhWmaFFVSfXvM34mWudbjyN9ogwLyMqk/iDkDQSrjQlGvtbQPsl6rL3FEoNWjfjXOodj1zZHjxoElEk1ktb3rQ5+U1r5GiQUFgASmnD7onTn7lPT+jUA2TsL7X8xrJPrkz4adLGXdQ0zX0pHaQ/8zIVTlKCz5MJQvU6s8C8HXFVjRcr4nEVY43EzCuz6FdBV8xLNFfyXC+KJaKk59HSsNiQK8xHKUiKzWQg+eXcWoQnoGkipPmyobi/Id5FB1QW+6wC2AgQoyGqNJEG80YKP510pULAemww4B00pIkETHLbENErUAyVqrz9yJ/hptpxLFNo+mOszP4Fu/A2UCkJGlqmD0d9/V5Q1+9/thA93xFkqslNMVfia8E4vKuwkTmpe3N5pDWKpm07U2/3A4wVgp/liNCLrxRIa8TpR51HIUaz4rLobhgK6jypoUMu97yp49xLeibcf6edP2zya8mAz2awIvjeotqcOLgV3L0Pi3//Nf/9//+Jd//1//8m//95///b//T+MCy9wAWWRcwdcm5q+6XRHyf2wygQ1kVEEV2FJQYPFdK/IPjS6QuadDq6SKSjOMif3TtGWpzN/Mzm09qQypCytoKbTlCYRf6RgW0oSDnpf5G/WQcDsuKE02AgQ9wIXIKWicKWhWRwiGg1K0WlDczwClKXJFYeBHjzexMznxQq2nh2YqAnVpvY41ou16YEch/kTBMJ9bMIzLdDA/oTkPJnsYGfAVZsYbCi8GBmbhRlV/pLC6QFgb1a0o0gRWeJAUnkH4YdSXEnYMwyhv07xnsm7d5Nbob736nGMMCzxuE1YeZq/nxvKxkbVEHD5LY8mf0A99ZKl6kqjY4PkonHb19QUGtKnlyPyZrjA0g/1lbARbVv2NiJDWDDxlN2QBT6GSavkG1hHg0wLLY7Z/oiPhChN05bem8UnI7PxXuKW9Z/L25SuT6DMrDN6i7fPpgnlAVJJEtYM8jn89BGn49IRYgWGixKpn40eDMpO0ZwG/R7y2GvOchyRJ3K5u6Py8nImV0iVQRbXKLEAGRQlDumPV+fmcQu3K91JnLpOVOFnfbM8LIzjMyCjQZOtr1c9f0kOdsxnKXdPXLkM4D9xGy5IU2Vb3VJOUcgIVRLcrQytzYzRGEHe9BJQKqc6tqMWZFSfXikXA2WW2VAuefpbrnFo60n16p5rFbvvytg3iEmPr7NwFvpaE/MyvityG1vGLPqzZIYRmenQ6iXZAIYFFOmRLKNqy1dPtAFdPZ18ZFxQOeAWF/c2L4+OSwmSQ/5KqwMMdiU2KjZUORtPbO1oZuy5dIE559PGoxN5hhr/YrMnZ2WBaFli+fZWp4bSiYZBro3Q4/IGTjaEGx9gqyGQa9tO6WmOLbjtRMPnyjVw/IU4lu23riWwee36xWOZ+mkM/Krk9De58UW6Nzw365rzO/0XeHYNI/MQ+/agE53MiaF4qetn41f2GGnk3bsSRz7IRs88lOJ2S7CwzujaDd7bWM8yvEFU2QS6d7j4wQBznZYQYZW+MBTFy7mCmFhm/+Yd/MFDnkMmyDo0G3rPD36tr5HeZ82OqtK+pUTp4Pohj++yU/s4viULQFfOLVBb6rFV1FlLZhuhaPEUC1KetSce8U/KSYNub3+PxDeZVRfPQumv/PBnoE0sWzMRCa8iRniZxIxay2LZGTsIiWBvDgRRgcWHTB4LVKKtyXe/nBzWrozLus173tmkm1Vr4uKKBLZIkOD8IPlHLx5Vm0w0KqqiFHz8aRK6dolfMvEwQeA++dXjb1MdndUr+d//63/4LWc5A3uIyvJWI2fwG/cGiKgbXJP04/H2ZgHRTgQxFZZVJzMWorI7wg/Hx+Qr6gzZOZddarYZ3yHjmG8H2dndRy1i2Qy9I6fud/j79wQi/uOH8s9H3KsKtijZsv6J1sa4fJLt8ir8G0v5sAmkfT0OTztzVKemvAazfJoBVo0B13dZKxDXICUmHiS1RHrIhtiTP2vYpC8RJUmrnVwm1DE/BCbCsVwvdPUDuJHr4UZaHFq88x9zwY2FNYX/KuhmC8AJNGCV1Xpop+IAlWaBTYiwkP/xygSCSBuFTb8d5XhPz9PWtFGcz2whpxeka1whVTABNxtQQ0JofgjK8ELGKkx/GCUwjE2Hpzm34rDjAV0hm9CMiIL3eioO0lWcJ8AUhjDuPrYc8OUN4SdKohNkY3aqU1NIGyaWGHFh+t+xxqV1k6W0KuWUgSSsjTt5hdDRwNh2Kby3KPLqFtRHBGiSpEZf5FT/H3yVZVUMQGXlswCzFWuXZyDMDH03SQDunVn4X4INzcZMUtQNdtaRAy0AePQ3HIzAz1FR3HmP0pK0CJbNhS/L+V6hFtQDqT6lWNLOS0pLCTF0X9BBwkniPjICC192FNATFe7/GffE+GJPwL8xGjhWkGaKh6/2wIayqz4wd1i/eSdmzievGrI1pVrVHFoLNDAD29PwGFrHIR7jiLTJxH19hWSchSNvgsGsSRSnU3ZHDATufho0BpypPbzU8ts04j4Mb/ogZuOkV7+0GufhnEkEujaCp5dI5tbh9wJxd27G7NhhJjm9JmprhBWRniOPnjiBLrk2aNosLw36x/SYCxEwyM7/VRpLFSZZQqdz99yai28ZqeyhvWSbwDU7vQ4n64snOgTOcA/zv4Rw4/Q4QHdfmqNk+n+7rvJCrd+RWDlai9psZgGwD+QG0fhDQPbnPjRXp2PzPAR1FQlzujUr/+GQ9C6gB7Yj56gS25Rs2Gz3kbaymG/nnUEeU1xVPjeMob4IQrq4HXEdOHkFOFkVO6JfFbAUBbCT0TdZO7Q8z+yPegfaWVOwJW+HQLt1zqJ3ut3XTviHY0Civ0UZ++tFucHHI6ksjDj85z/dhlggiBL3YXiWNxBCN5XLGcoJKBT5QJG0vEA4ramUNgkzwv7G8fQJV0lQM7XavJariXQcvdVKIJyav/YCZOFg+sVrbBX4Ijo3bwoD37oQJQ7ZU82Vpv1WXLks/lSX1aNkvR6gYeRUY8U4g9Y3DCtWK9xOnmxlxOLXzBcw6Kb6MaUovDXcMsyYAuBqiVr6t7gRN+LhKFJ2zeGXIU/5WJvg5UdGTc2hJWd1hDi3+u+2O3EqTrtqpJecvwBnbx9rJBQAuOdzOtzjcD8HCtzkHM+DkUPMaB2YGJIX2kVKA4wTq8GLC9xCmfbfOsXDXHo3G9kjdZ7/+Cj+wbaAyRqq09cO918d+8q0fcEp482jIgvtPqMrQ809TAxLy7r3O763g7G6R6Dz5cZTX9256jpj92ycXaauEBIeg5b9pUq/aw9QjejbPaX4CKVdtGptNttwwE/rpEKnCa6OO9qVVr3DFJtvxNn6wcdzd5sXmecYGzanVbQQO9e4lsNuBmOOfG4RjalmsskPxmUm1h3vzrqMA9VvWRDYOIgg6h2adf5Bnr5VIeD+ZVZFkGSyFO/+tNbfWvVKUMIZlZZYwuoUwMq95a99Cf0pDycdWGFkUObE+hddaHYxQD25lgyznxatmrFpz2dO7th5EYmzgOhYQFTk1YxDWFY6sESTGkI1XlKzFc+bHTh+FEsjcSp+sco+9oOYJ1m+QAoxThocWvljf8syFMFkW/IixeRlhYndwQDlBU1gjBzrCBNq7F9uD1zVWdnG7AF4PF+lzFdzcTf6uHTt7dydYliROWz1cUwZ3wYs7lnrlt97OC04CeG0JvP5CeMNLUggzM7vD6I/aqGouRr1HShBBCMQ5ZHS4nHKLlF0cxOFCIp+D3RR85Ld6ljLk7FB9oZc90oi6Nq0WLjn0IlGDWGa1ZtGv0eoa97DkGhx90bqxcNqP4AJYjVTYPqYPafwiwMldkPo1Z0QcISCsi7Sk0tFuHdiEoAE2y4S/4/MZ44p53/ylHeKkrOrGzruwNyN/AiPJipus9vvoszJ/az6azMTSqN4xFV+mkmQuunhXO9BM+4dbjW7CUZf3RVcClsl+tF8cQxI/v3CzD3Ee3mSV8cVb3nx6VwkZ5YcfU15eC6X6zPJSbmnn4Odz2aoNrmz6YazRzEQmxXOTWnBnSMvgZvya2GnP66Nttu587aMwW9i1FzN5Ctm4z9CcK79RVZBZ/hH83l/M75FZGMGoeTCXGLpRm1TDR3TkjDuM0um987NkJ5Y7FN40/KaP8xo3s7gazfKLuYMcExPl0tXcOu4o7vN9tp9PPJVYfBvtNHJ8dNcxcx/3RhC+mjZYrpcD3CVED6EKY2mBecrL7FuqJkrrB3LFgsm0XIKd7MR6NbmGBeW9JKjto0Kx2Tm0vHgbjNfY1UG0om0U8ZeJ7tNdHCwEDEQRv9ArXzRsLVnoNltYgIjY8whUFzgrbspzxqkkzF2qKlcuSIeZUUtsVeICUTQuHjdHvtNJzJmvJJttXPlnGGJ5IhxPSnucADfPOAfDr7Pxw7lbHqp/04ZJb421t5puJ3JjiZsqIRyiG1pfE1pMtM071yRLsDOjr+QksqSO92I5CO0VLW6jOIh2AYeSV9fI56vea1GgNC1tVVbL24m2ySeiue5aZ+sXz9Tb1SO5H7Cs7kqZCfw3OJuj7aBlLWZTpu/7NnXWPzn2absUVMoEvq5bk1S1P9ko0rGaPUob5N6b6mUEf062D8p6ESWvKmgVlK7dKVzFC0BcTYySJSB7IzWgV1a3tpayqu+eEV0eC3AmMni9aiaAEbm9e//F8XnaMoMGkaDAKHYi6y0uXoVydHEUlGtvPHuDmtbZLhc1+hUWRa5MBbsWCcAMOiZoymfq5kpKRuJXtRbU+tUetyC5B4ktAj9bfeLm364xskjG5feDWXmWTrptaoVzaOD/A2iLB38lawEA';
    const codec = typeof fflate !== 'undefined' && fflate && typeof fflate.gunzipSync === 'function' && typeof fflate.strFromU8 === 'function'
      ? fflate
      : null;
    if (!codec) return '';
    try {
      const bytes = new Uint8Array(base64ToArrayBuffer(encoded));
      getWorkflowPatchCssText.cache = codec.strFromU8(codec.gunzipSync(bytes)).split('#$' + '{PANEL_ID}').join('#' + PANEL_ID);
      return getWorkflowPatchCssText.cache;
    } catch (error) {
      console.warn('PLM floating helper workflow patch decode failed:', error);
      return '';
    }
  }

  function ensureWorkflowPatchStyles() {
    const id = 'pfh-workflow-patch-styles';
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.documentElement.appendChild(style);
    }
    const text = getWorkflowPatchCssText();
    if (style.textContent !== text) style.textContent = text;
  }

  function homeFeatureRailViewportFromTarget(target) {
    return target && target.closest ? target.closest('.pfh-home-feature-viewport') : null;
  }

  function homeFeatureRailTrackTransform(isProduct, offset) {
    const base = isProduct ? '-100%' : '0%';
    if (!offset) return 'translateX(' + base + ')';
    const roundedOffset = Math.round(offset * 100) / 100;
    return 'translateX(calc(' + base + ' + ' + roundedOffset + 'px))';
  }

  function homeFeatureRailSnapBack(drag) {
    if (!drag || !drag.track) return;
    const track = drag.track;
    const snapId = (Number(track.__pfhHomeFeatureRailSnapId) || 0) + 1;
    track.__pfhHomeFeatureRailSnapId = snapId;
    track.style.setProperty('transition', 'transform .38s cubic-bezier(.2, 1.25, .35, 1)');
    track.style.setProperty('transform', homeFeatureRailTrackTransform(drag.startIsProduct, 0));
    window.setTimeout(() => {
      if (!track.isConnected || track.__pfhHomeFeatureRailSnapId !== snapId) return;
      track.style.removeProperty('transform');
      track.style.removeProperty('transition');
    }, 410);
  }

  function releaseHomeFeatureRailPointer(drag) {
    if (!drag || !drag.viewport || drag.pointerId == null || typeof drag.viewport.releasePointerCapture !== 'function') return;
    try {
      if (typeof drag.viewport.hasPointerCapture !== 'function' || drag.viewport.hasPointerCapture(drag.pointerId)) {
        drag.viewport.releasePointerCapture(drag.pointerId);
      }
    } catch (_) {}
  }

  function cancelHomeFeatureRailDrag(panel) {
    const drag = panel && panel.__pfhHomeFeatureDrag;
    if (!drag) return;
    panel.__pfhHomeFeatureDrag = null;
    drag.viewport.classList.remove('is-dragging');
    releaseHomeFeatureRailPointer(drag);
    if (drag.dragging) homeFeatureRailSnapBack(drag);
  }

  function handleHomeFeatureRailPointerDown(event) {
    const panel = event.currentTarget;
    const viewport = homeFeatureRailViewportFromTarget(event.target);
    if (!viewport || event.isPrimary === false || (event.button !== undefined && event.button !== 0)) return;
    if (state.homeFeatureEditMode || viewport.closest('.is-editing')) return;
    const blocked = event.target && event.target.closest && event.target.closest('a, input, textarea, select, [contenteditable="true"], button:not(.pfh-home-entry)');
    if (blocked) return;
    const track = viewport.querySelector('.pfh-home-feature-track');
    if (!track) return;
    cancelHomeFeatureRailDrag(panel);
    const animation = track.__pfhHomeFeatureRailAnimation;
    if (animation && typeof animation.cancel === 'function') {
      try { animation.cancel(); } catch (_) {}
      track.__pfhHomeFeatureRailAnimation = null;
    }
    track.classList.remove('is-to-product', 'is-to-daily');
    track.style.removeProperty('transition');
    track.style.removeProperty('transform');
    const drag = {
      viewport,
      track,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      startIsProduct: track.classList.contains('is-product-development'),
      dragging: false,
      pointerCaptured: false,
    };
    panel.__pfhHomeFeatureDrag = drag;
  }

  function handleHomeFeatureRailPointerMove(event) {
    const panel = event.currentTarget;
    const drag = panel.__pfhHomeFeatureDrag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    drag.lastX = event.clientX;
    if (!drag.dragging) {
      if (Math.abs(deltaX) < 8) return;
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.15) {
        cancelHomeFeatureRailDrag(panel);
        return;
      }
      drag.dragging = true;
      drag.viewport.classList.add('is-dragging');
      try {
        if (!drag.pointerCaptured && typeof drag.viewport.setPointerCapture === 'function') {
          drag.viewport.setPointerCapture(event.pointerId);
          drag.pointerCaptured = true;
        }
      } catch (_) {}
    }
    const canMoveToProduct = !drag.startIsProduct && deltaX < 0;
    const canMoveToDaily = drag.startIsProduct && deltaX > 0;
    const offset = (canMoveToProduct || canMoveToDaily) ? deltaX : deltaX * .24;
    drag.track.style.setProperty('transition', 'none');
    drag.track.style.setProperty('transform', homeFeatureRailTrackTransform(drag.startIsProduct, offset));
    if (event.cancelable) event.preventDefault();
  }

  function handleHomeFeatureRailPointerEnd(event) {
    const panel = event.currentTarget;
    const drag = panel.__pfhHomeFeatureDrag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    panel.__pfhHomeFeatureDrag = null;
    const deltaX = (Number.isFinite(event.clientX) ? event.clientX : drag.lastX) - drag.startX;
    const threshold = Math.max(46, Math.min(96, drag.viewport.clientWidth * .16));
    const movedFarEnough = drag.dragging && Math.abs(deltaX) >= threshold;
    const targetMode = movedFarEnough ? (deltaX < 0 ? 'product-development' : 'daily') : '';
    const currentMode = drag.startIsProduct ? 'product-development' : 'daily';
    const shouldSwitch = targetMode && targetMode !== currentMode;
    drag.viewport.classList.remove('is-dragging');
    releaseHomeFeatureRailPointer(drag);
    if (drag.dragging) {
      panel.__pfhHomeFeatureSuppressClickUntil = Date.now() + 420;
      if (event.cancelable) event.preventDefault();
    }
    if (shouldSwitch) {
      const canMoveToProduct = !drag.startIsProduct && deltaX < 0;
      const canMoveToDaily = drag.startIsProduct && deltaX > 0;
      const offset = (canMoveToProduct || canMoveToDaily) ? deltaX : deltaX * .24;
      // 把释放瞬间的视觉位置交给后续切换动画，避免切换时先回到起点。
      drag.track.style.setProperty('transform', homeFeatureRailTrackTransform(drag.startIsProduct, offset));
      drag.track.__pfhHomeFeatureRailStartTransform = drag.track.style.getPropertyValue('transform');
      drag.track.style.removeProperty('transition');
      setProductDevelopmentWorkMode(targetMode);
      return;
    }
    if (drag.dragging) homeFeatureRailSnapBack(drag);
  }

  function handleHomeFeatureRailClickCapture(event) {
    const panel = event.currentTarget;
    if (Number(panel.__pfhHomeFeatureSuppressClickUntil) > Date.now()) {
      panel.__pfhHomeFeatureSuppressClickUntil = 0;
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function ensurePanel() {
    if (!document.getElementById(PANEL_ID + '-home-collection-style')) {
      const style = document.createElement('style');
      style.id = PANEL_ID + '-home-collection-style';
      style.textContent = HOME_COLLECTION_CSS;
      document.documentElement.appendChild(style);
    }
    if (!document.getElementById(PANEL_ID + '-detail-history-style')) {
      const style = document.createElement('style');
      style.id = PANEL_ID + '-detail-history-style';
      style.textContent = DETAIL_HISTORY_CSS;
      document.documentElement.appendChild(style);
    }
    ensureLucianPreviewStyles();
    if (!document.getElementById(PANEL_ID + '-sku-detail-layout-style')) {
      const style = document.createElement('style');
      style.id = PANEL_ID + '-sku-detail-layout-style';
      style.textContent = SKU_DETAIL_LAYOUT_CSS;
      document.documentElement.appendChild(style);
    }
    ensureWorkflowPatchStyles();
    if (!document.getElementById(PANEL_ID + '-copywriting-layout-style')) {
      const style = document.createElement('style');
      style.id = PANEL_ID + '-copywriting-layout-style';
      style.textContent = PRODUCT_DEVELOPMENT_COPYWRITING_CSS;
      document.documentElement.appendChild(style);
    }
    let panel = document.getElementById(PANEL_ID);
    if (panel) {
      if (panel.dataset.version !== SCRIPT_VERSION) {
        panel.remove();
        panel = null;
      } else {
        panel.dataset.version = SCRIPT_VERSION;
        installLocalImageCache(panel);
        installVisibleTechnicalTextNeutralizer(panel);
        applyThemeToView();
        return panel;
      }
    }
    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.dataset.version = SCRIPT_VERSION;
    panel.innerHTML = '<div class="pfh-full"><div class="pfh-header"><div class="pfh-heading"><strong></strong><div class="pfh-search"><span class="pfh-search-box"><input type="search" name="plm-sku-search" role="searchbox" class="pfh-search-input" autocomplete="off" autocapitalize="off" spellcheck="false" data-form-type="other" data-lpignore="true" data-1p-ignore="true"><button type="button" class="pfh-search-clear" data-action="clear-search"></button></span><button type="button" data-action="search"></button></div></div><div class="pfh-actions"><button type="button" data-action="home-main"></button><button type="button" data-action="notifications"></button><button type="button" data-action="about"></button><button type="button" data-action="collapse"></button></div></div><div class="pfh-main"><aside class="pfh-list"></aside><div class="pfh-splitter" title="\u62d6\u52a8\u8c03\u6574\u5de6\u53f3\u5bbd\u5ea6"></div><div class="pfh-detail"></div></div><input type="file" class="pfh-import-file" accept="application/json,.json"><div class="pfh-resize-handle pfh-resize-n" data-resize-dir="n"></div><div class="pfh-resize-handle pfh-resize-e" data-resize-dir="e"></div><div class="pfh-resize-handle pfh-resize-s" data-resize-dir="s"></div><div class="pfh-resize-handle pfh-resize-w" data-resize-dir="w"></div><div class="pfh-resize-handle pfh-resize-ne" data-resize-dir="ne"></div><div class="pfh-resize-handle pfh-resize-nw" data-resize-dir="nw"></div><div class="pfh-resize-handle pfh-resize-se" data-resize-dir="se" title="\u62d6\u52a8\u8c03\u6574\u7a97\u53e3\u5927\u5c0f"></div><div class="pfh-resize-handle pfh-resize-sw" data-resize-dir="sw"></div></div>';
    document.documentElement.appendChild(panel);
    const full = panel.querySelector('.pfh-full');

    panel.querySelector('.pfh-heading').insertAdjacentHTML('afterbegin', '<button type="button" class="pfh-my-avatar" data-action="my-profile-toggle" aria-label="我的" aria-haspopup="dialog" aria-expanded="false"><span aria-hidden="true">我</span></button>');
    panel.dataset.edition = PRODUCT_EDITION.id;
    panel.querySelector('.pfh-heading strong').insertAdjacentHTML('afterend', '<span class="pfh-edition-badge pfh-edition-' + escapeHtml(PRODUCT_EDITION.id) + '"><svg aria-hidden="true" viewBox="0 0 16 16"><path d="M3.2 10.8 10.7 3.3a1.55 1.55 0 0 1 2.2 0l.1.1a1.55 1.55 0 0 1 0 2.2l-7.5 7.5"></path><path d="m9.7 4.3 2 2"></path><path d="m2.4 13.7 3.4-.8-2.6-2.6-.8 3.4Z"></path></svg><b>' + escapeHtml(PRODUCT_EDITION.label) + '</b><small>' + escapeHtml(PRODUCT_EDITION.code) + '</small></span>');
    panel.querySelector('strong').textContent = L.title;
    panel.querySelector('.pfh-search-input').placeholder = L.searchPlaceholder;
    panel.querySelector('.pfh-search-clear').textContent = '\u00d7';
    panel.querySelector('.pfh-search-clear').title = L.clearSearch;
    panel.querySelector('[data-action="search"]').innerHTML = '<span class="pfh-btn-text">' + escapeHtml(L.search) + '</span>';
    panel.querySelector('[data-action="search"]').title = TOOLTIP.search;
    panel.querySelector('[data-action="about"]').innerHTML = iconHtml('settings') + '<span>\u8bbe\u7f6e</span><i class="pfh-settings-notice-dot" aria-hidden="true"></i>';
    panel.querySelector('[data-action="about"]').removeAttribute('title');
    panel.querySelector('[data-action="about"]').setAttribute('aria-label', TOOLTIP.about);
    panel.querySelector('[data-action="about"]').setAttribute('data-tooltip', TOOLTIP.about);
    panel.querySelector('[data-action="home-main"]').innerHTML = iconHtml('home') + '<span>\u4e3b\u9875</span>';
    panel.querySelector('[data-action="home-main"]').removeAttribute('title');
    panel.querySelector('[data-action="home-main"]').setAttribute('aria-label', '\u4e3b\u9875');
    panel.querySelector('[data-action="home-main"]').setAttribute('data-tooltip', '\u4e3b\u9875');
    panel.querySelector('[data-action="notifications"]').innerHTML = iconHtml('notification') + '<span>\u901a\u77e5</span><i class="pfh-notification-badge" aria-hidden="true"></i>';
    panel.querySelector('[data-action="notifications"]').setAttribute('aria-label', '\u901a\u77e5');
    panel.querySelector('[data-action="notifications"]').setAttribute('data-tooltip', '\u901a\u77e5');
    panel.querySelector('[data-action="collapse"]').setAttribute('data-action', 'panel-close');
    panel.addEventListener('click', handleLedgerMoreClickCapture, true);
    panel.addEventListener('click', handleHomeFeatureRailClickCapture, true);
    panel.addEventListener('click', (event) => runDiagnosticAction(handlePanelClick, event));
    panel.addEventListener('contextmenu', handlePanelContextMenu);
    panel.addEventListener('keydown', (event) => runDiagnosticAction(handlePanelKeydown, event));
    panel.addEventListener('input', (event) => runDiagnosticAction(handlePanelInput, event));
    panel.addEventListener('paste', (event) => runDiagnosticAction(handlePanelPaste, event));
    panel.addEventListener('change', (event) => runDiagnosticAction(handlePanelChange, event));
    ['dblclick', 'focusin', 'focusout'].forEach((type) => panel.addEventListener(type, productDevelopmentHandleProtectedField));
    panel.addEventListener('pointerdown', handleLedgerTableSkuPointerDown);
    panel.addEventListener('pointermove', handleLedgerTableSkuPointerMove);
    panel.addEventListener('pointerup', handleLedgerTableSkuPointerEnd);
    panel.addEventListener('pointercancel', handleLedgerTableSkuPointerEnd);
    panel.addEventListener('pointerdown', handleLedgerCardSelectionPointerDown);
    panel.addEventListener('pointermove', handleLedgerCardSelectionPointerMove);
    panel.addEventListener('pointerup', handleLedgerCardSelectionPointerEnd);
    panel.addEventListener('pointercancel', handleLedgerCardSelectionPointerEnd);
    panel.addEventListener('pointerdown', handleHomeFeatureRailPointerDown);
    panel.addEventListener('pointermove', handleHomeFeatureRailPointerMove);
    panel.addEventListener('pointerup', handleHomeFeatureRailPointerEnd);
    panel.addEventListener('pointercancel', handleHomeFeatureRailPointerEnd);
    panel.addEventListener('scroll', handleLedgerMenuScroll, true);
    panel.addEventListener('dragstart', handlePanelDragStart);
    panel.addEventListener('dragend', handlePanelDragEnd);
    panel.addEventListener('dragover', handlePanelDragOver);
    panel.addEventListener('drop', handlePanelDrop);
    panel.querySelector('.pfh-import-file').addEventListener('change', handleImportFile);
    installCustomSelectController(panel);
    installVisibleTechnicalTextNeutralizer(panel);
    makeDraggable(panel, panel.querySelector('.pfh-header'));
    makeSplitterDraggable(panel, panel.querySelector('.pfh-splitter'));
    makePanelResizable(panel);
    applySavedPosition(panel);
    applyPanelSize(panel);
    applySplitWidth(panel);
    updatePanelPinButton(panel);
    applyThemeToView();
    installLocalImageCache(panel);
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
    applyThemeToView();
    return launcher;
  }

  function expandPanel(options) {
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
    if (!options || options.render !== false) renderShell();
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
    closeMyProfile();
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
    const hasUpdate = isScriptUpdateAvailable();
    button.classList.toggle('has-settings-notice', !state.settings.backgroundNoticeSeen || hasUpdate);
    button.classList.toggle('has-script-update', hasUpdate);
    button.setAttribute('aria-label', hasUpdate ? '设置，有新版本可更新' : TOOLTIP.about);
    button.setAttribute('data-tooltip', hasUpdate ? '有新版本' : TOOLTIP.about);
  }


  function profileUsageRecord(name) {
    if (!name) return null;
    const saved = readProductDevelopmentStorage(PROFILE_USAGE_KEY, {});
    const records = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    const key = encodeURIComponent(name);
    const existing = records[key];
    const now = Date.now();
    if (existing && Number.isFinite(existing.recordedAtMs) && existing.recordedAtMs > 0 && existing.recordedAtMs <= now) return existing;
    const record = { recordedAtMs: now };
    writeProductDevelopmentStorage(PROFILE_USAGE_KEY, { ...records, [key]: record });
    return record;
  }

  function taskEmptyStateHtml(title, detail) {
    return '<div class="pfh-task-empty"><img data-local-image="' + escapeHtml(CLOUD_BACKUP_API_BASE + '/assets/export-icons/task-empty-glass-v1.png') + '" alt="" width="52" height="52" decoding="async"><strong>' + escapeHtml(title) + '</strong>' + (detail ? '<p>' + escapeHtml(detail) + '</p>' : '') + '</div>';
  }

  function profileCompanionDays(at, now = Date.now()) {
    const start = Date.parse(at);
    if (!Number.isFinite(start) || start <= 0 || start > now) return 0;
    // Calendar days in Beijing time; the first day counts as day one.
    return Math.floor((now + 28800000) / 86400000) - Math.floor((start + 28800000) / 86400000) + 1;
  }

  async function refreshMyProfileBackup() {
    const name = findCurrentPlmUserName();
    const key = getCloudBackupKey();
    const identity = name + '\n' + key;
    if (myProfile.backupKey === identity && (myProfile.backupLoading || myProfile.backupOrigin)) return;
    myProfile.backupKey = identity;
    myProfile.backupOrigin = null;
    myProfile.backupLoading = Boolean(name && key);
    if (!myProfile.backupLoading) return;
    try {
      const backupId = await getCloudBackupId(key);
      const result = await cloudRequest('/backup/profile?backupId=' + encodeURIComponent(backupId) + '&name=' + encodeURIComponent(name), { method: 'GET' });
      if (findCurrentPlmUserName() !== name || getCloudBackupKey() !== key || myProfile.backupKey !== identity) return;
      myProfile.backupOrigin = result;
    } catch (_) {
      if (myProfile.backupKey === identity) myProfile.backupOrigin = { failed: true };
    } finally {
      if (myProfile.backupKey === identity) { myProfile.backupLoading = false; renderMyProfile(ensurePanel()); }
    }
  }

  function myProfileBodyHtml(name, usage) {
    const tasks = profileTaskItems();
    const recorded = usage ? new Date(usage.recordedAtMs).toLocaleDateString('zh-CN') : '';
    const origin = myProfile.backupOrigin;
    const days = origin && profileCompanionDays(origin.firstBackupAt);
    const usageHtml = days
      ? '<span>助手已陪伴你 <b>' + days + '</b> 天</span><small>从' + (origin.firstBackupExact ? '首次备份' : '最早可查备份') + '算起 · ' + escapeHtml(new Date(origin.firstBackupAt).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })) + '</small>'
      : '<span>' + (myProfile.backupLoading ? '正在读取备份时间…' : origin && origin.failed ? '暂时无法读取备份时间' : '还没有云备份记录') + '</span>' + (recorded ? '<small>本机记录始于 ' + escapeHtml(recorded) + '</small>' : '');
    return '<div class="pfh-my-identity"><span class="pfh-my-portrait" aria-hidden="true">' + escapeHtml(name ? Array.from(name)[0] : '我') + '</span><div><h3>' + escapeHtml(name || '暂未识别用户') + '</h3><p>我的 PLM 工作空间</p></div></div>'
      + '<div class="pfh-my-usage">' + usageHtml + '</div>'
      + '<section class="pfh-my-tasks"><header><strong>任务动态</strong><span>' + (tasks.length ? '最近 ' + tasks.length + ' 项' : '') + '</span></header>'
      + (tasks.length ? tasks.map((task) => '<button type="button" class="pfh-my-task" data-tone="' + escapeHtml(task.tone || 'waiting') + '" data-action="' + escapeHtml(task.action) + '"><span>' + iconHtml(task.icon) + '</span><div><strong>' + escapeHtml(task.title) + '</strong><small>' + escapeHtml(task.status) + '</small><progress max="100" value="' + task.progress + '" aria-label="' + escapeHtml(task.title + '进度') + '"></progress></div><em>' + task.progress + '%</em></button>').join('') : taskEmptyStateHtml('暂时没有进行中的任务')) + '</section>';
  }

  function animateMyProfile(dialog, closing) {
    if (typeof dialog.animate !== 'function' || (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return null;
    return dialog.animate(closing ? [
      { opacity: 1, transform: 'translateY(0) scale(1)' },
      { opacity: 1, transform: 'translateY(-3px) scale(1.025)', offset: .25 },
      { opacity: 0, transform: 'translateY(-18px) scale(.88)' },
    ] : [
      { opacity: 0, transform: 'translateY(-20px) scale(.86)' },
      { opacity: 1, transform: 'translateY(3px) scale(1.035)', offset: .68 },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ], { duration: closing ? 220 : 420, easing: 'cubic-bezier(.22,1,.36,1)' });
  }

  function positionMyProfile() {
    const avatar = document.getElementById(PANEL_ID)?.querySelector('.pfh-my-avatar');
    const layer = myProfile.layer;
    if (!avatar || !layer) return;
    const rect = avatar.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    const top = Math.min(rect.bottom + 8, window.innerHeight - 100);
    layer.style.width = width + 'px';
    layer.style.left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)) + 'px';
    layer.style.top = Math.max(12, top) + 'px';
    layer.style.maxHeight = Math.max(80, window.innerHeight - top - 12) + 'px';
  }

  function closeMyProfile(restoreFocus = true) {
    if (!myProfile.open || myProfile.closing) return;
    myProfile.open = false;
    myProfile.closing = true;
    window.clearInterval(myProfile.timer);
    myProfile.timer = 0;
    if (myProfile.outsideHandler) {
      document.removeEventListener('pointerdown', myProfile.outsideHandler, true);
      document.removeEventListener('focusin', myProfile.outsideHandler, true);
      myProfile.outsideHandler = null;
    }
    window.removeEventListener('resize', positionMyProfile);
    window.removeEventListener('scroll', positionMyProfile, true);
    const layer = myProfile.layer;
    const button = document.getElementById(PANEL_ID)?.querySelector('.pfh-my-avatar');
    if (button) button.setAttribute('aria-expanded', 'false');
    const finish = () => {
      if (layer) layer.remove();
      myProfile.layer = null;
      myProfile.closing = false;
      if (restoreFocus && myProfile.focus && myProfile.focus.isConnected) myProfile.focus.focus();
      myProfile.focus = null;
    };
    const animation = layer && animateMyProfile(layer.querySelector('.pfh-my-dialog'), true);
    if (animation) animation.finished.then(finish, finish); else finish();
  }

  function renderMyProfile(panel) {
    if (!panel) return;
    const name = findCurrentPlmUserName();
    const usage = profileUsageRecord(name);
    if (myProfile.backupKey && myProfile.backupKey !== name + '\n' + getCloudBackupKey()) {
      myProfile.backupKey = '';
      myProfile.backupOrigin = null;
      if (myProfile.open) refreshMyProfileBackup();
    }
    const button = panel.querySelector('.pfh-my-avatar');
    if (button) {
      button.setAttribute('aria-expanded', String(myProfile.open));
      button.querySelector('span').textContent = name ? Array.from(name)[0] : '我';
      button.setAttribute('title', '我的');
    }
    if (!myProfile.open || myProfile.closing) return;
    let layer = myProfile.layer;
    if (!layer || !layer.isConnected) {
      layer = document.createElement('div');
      layer.className = 'pfh-my-layer';
      layer.innerHTML = '<section class="pfh-my-dialog" role="dialog" aria-label="我的"><header class="pfh-my-header"><strong>我的</strong><button type="button" data-action="my-profile-close" aria-label="关闭我的">×</button></header><div class="pfh-my-body"></div></section>';
      panel.querySelector('.pfh-full').appendChild(layer);
      myProfile.layer = layer;
      positionMyProfile();
      animateMyProfile(layer.querySelector('.pfh-my-dialog'), false);
      layer.querySelector('button').focus();
      myProfile.outsideHandler = (event) => {
        if (!layer.contains(event.target) && !button?.contains(event.target)) closeMyProfile(false);
      };
      document.addEventListener('pointerdown', myProfile.outsideHandler, true);
      document.addEventListener('focusin', myProfile.outsideHandler, true);
      window.addEventListener('resize', positionMyProfile);
      window.addEventListener('scroll', positionMyProfile, true);
    }
    const body = layer.querySelector('.pfh-my-body');
    const html = myProfileBodyHtml(name, usage);
    // Keep the dialog and focused task buttons intact while background queues update.
    if (body.innerHTML !== html && !body.contains(document.activeElement)) body.innerHTML = html;
    positionMyProfile();
  }

  function toggleMyProfile() {
    if (myProfile.closing) return;
    if (myProfile.open) { closeMyProfile(); return; }
    myProfile.focus = document.activeElement;
    myProfile.open = true;
    refreshMyProfileBackup();
    renderMyProfile(ensurePanel());
    myProfile.timer = window.setInterval(() => {
      if (!state.expanded || !myProfile.layer?.isConnected) { closeMyProfile(); return; }
      renderMyProfile(ensurePanel());
    }, 1000);
  }

  const DETAIL_VIEW_TABS = Object.freeze([
    { id: 'detail', label: '详情' },
    { id: 'copywriting', label: '文案' },
    { id: 'parameterImage', label: '参数图' },
    { id: 'sizeImage', label: '尺寸图' },
  ]);

  function normalizeDetailViewTab(value) {
    const tab = String(value || '');
    return DETAIL_VIEW_TABS.some((item) => item.id === tab) ? tab : 'detail';
  }

  function getCurrentDetailViewTab() {
    if (state.view === 'parameterImage') return 'parameterImage';
    if (state.view === 'sizeImage') return 'sizeImage';
    return state.copywritingMode ? 'copywriting' : 'detail';
  }

  function detailViewTabsHtml(activeView) {
    const active = normalizeDetailViewTab(activeView || getCurrentDetailViewTab());
    const sizeImageDisabled = !state.sizeImageAccessEnabled;
    const sizeImageTitle = state.sizeImageAccessLoading ? '正在准备功能' : '该功能暂未开放，敬请期待';
    const parameterImageDisabled = !state.parameterImageAccessEnabled;
    const parameterImageTitle = state.parameterImageAccessLoading ? '正在准备功能' : '该功能暂未开放，敬请期待';
    const buttons = DETAIL_VIEW_TABS.map((tab) => {
      const selected = tab.id === active;
      const disabled = (tab.id === 'sizeImage' && sizeImageDisabled) || (tab.id === 'parameterImage' && parameterImageDisabled);
      const title = tab.id === 'parameterImage' ? parameterImageTitle : sizeImageTitle;
      return '<button type="button" role="tab" data-action="detail-view-tab" data-detail-view="' + tab.id + '" class="' + (selected ? 'is-active' : '') + '" aria-selected="' + String(selected) + '"' + (disabled ? ' disabled aria-disabled="true" title="' + escapeHtml(title) + '"' : '') + '>' + escapeHtml(tab.label) + '</button>';
    }).join('');
    return '<nav class="pfh-detail-view-tabs" data-active-view="' + escapeHtml(active) + '" role="tablist" aria-label="SKU详情视图"><span class="pfh-detail-view-indicator" aria-hidden="true"></span>' + buttons + '</nav>';
  }

  function setupDetailViewTabs(panel) {
    const tabs = panel && panel.querySelector('.pfh-detail-view-tabs');
    const indicator = tabs && tabs.querySelector('.pfh-detail-view-indicator');
    const activeButton = tabs && tabs.querySelector('button.is-active');
    if (!tabs || !indicator || !activeButton) return;
    const transition = 'left .6s cubic-bezier(.25,1.2,.35,1),width .6s cubic-bezier(.25,1.2,.35,1)';
    const moveIndicator = (button) => {
      if (!button) return;
      indicator.style.setProperty('left', button.offsetLeft + 'px', 'important');
      indicator.style.setProperty('width', button.offsetWidth + 'px', 'important');
    };
    const previousValue = String(state.detailViewPreviousTab || '');
    const previous = DETAIL_VIEW_TABS.some((item) => item.id === previousValue) ? previousValue : '';
    const previousButton = previous && previous !== activeButton.getAttribute('data-detail-view')
      ? tabs.querySelector('button[data-detail-view="' + previous + '"]')
      : null;
    const activeView = activeButton.getAttribute('data-detail-view');
    if (tabs.pfhDetailTabActiveView === activeView && !previousButton) {
      moveIndicator(activeButton);
    } else if (previousButton) {
      indicator.style.setProperty('transition', 'none', 'important');
      moveIndicator(previousButton);
      window.requestAnimationFrame(() => {
        if (!indicator.isConnected) return;
        indicator.style.setProperty('transition', transition, 'important');
        moveIndicator(activeButton);
      });
    } else {
      indicator.style.setProperty('transition', 'none', 'important');
      moveIndicator(activeButton);
      window.requestAnimationFrame(() => {
        if (indicator.isConnected) indicator.style.setProperty('transition', transition, 'important');
      });
    }
    tabs.querySelectorAll('button[data-action="detail-view-tab"]').forEach((button) => {
      if (button.pfhDetailTabPointerBound) return;
      button.pfhDetailTabPointerBound = true;
      button.addEventListener('mousemove', (event) => {
        const rect = button.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        button.style.setProperty('--mx', ((event.clientX - rect.left) / rect.width * 100) + '%');
        button.style.setProperty('--my', ((event.clientY - rect.top) / rect.height * 100) + '%');
      });
    });
    tabs.pfhDetailTabActiveView = activeView;
    state.detailViewPreviousTab = '';
  }

  function isWorkspaceLayoutEnabled() {
    return state.settings.workspaceLayout === 'workspace' || (state.settings.workspaceLayout !== 'classic' && WORKSPACE_PREVIEW);
  }

  function isWorkspaceSkuView() {
    return isWorkspaceLayoutEnabled() && ['detail', 'parameterImage', 'sizeImage'].includes(state.view);
  }

  function setWorkspaceLayoutEnabled(enabled) {
    if (isWorkspaceLayoutEnabled() === enabled) return;
    state.settings.workspaceLayout = enabled ? 'workspace' : 'classic';
    state.panelSize = loadPanelSize();
    saveSettings(state.settings);
    renderShell();
    const panel = document.getElementById(PANEL_ID);
    if (panel) {
      applyPanelSize(panel);
      applySplitWidth(panel);
      panel.style.right = clamp(Number.parseFloat(panel.style.right) || 0, 0, Math.max(0, window.innerWidth - Number.parseFloat(panel.style.width) - 8)) + 'px';
      panel.style.bottom = clamp(Number.parseFloat(panel.style.bottom) || 0, 0, Math.max(0, window.innerHeight - Number.parseFloat(panel.style.height) - 8)) + 'px';
    }
  }

  function workspaceLayoutSettingsHtml() {
    const enabled = isWorkspaceLayoutEnabled();
    return settingsCardHtml('界面布局', enabled ? '新版三栏' : '经典视图',
      '<div class="pfh-pixel-room-toggle"><label><input type="checkbox" role="switch" class="pfh-workspace-layout-enabled" aria-checked="' + enabled + '"' + (enabled ? ' checked' : '') + '><span>使用新版三栏视图</span></label></div><div class="pfh-about-note">关闭后使用经典布局；切换立即生效。两种视图分别记住手动调整的窗口大小。</div>');
  }

  function restoreWorkspaceClassicShell(panel) {
    const workspace = panel.querySelector('.pfh-workspace');
    delete panel.dataset.workspacePreview;
    if (!workspace) return;
    const main = panel.querySelector('.pfh-main');
    ['.pfh-list', '.pfh-splitter', '.pfh-detail'].forEach((selector) => {
      const node = workspace.querySelector(selector);
      if (node) main.appendChild(node);
    });
    const actions = panel.querySelector('.pfh-header .pfh-actions');
    const close = actions.querySelector('[data-action="panel-close"]');
    ['home-main', 'notifications', 'about'].forEach((action) => {
      const button = workspace.querySelector('[data-action="' + action + '"]');
      if (!button) return;
      button.classList.remove('pfh-workspace-nav-button', 'is-active');
      button.removeAttribute('aria-current');
      button.removeAttribute('title');
      actions.insertBefore(button, close);
    });
    const search = panel.pfhWorkspaceSearch || panel.querySelector('.pfh-search');
    if (search) panel.querySelector('.pfh-heading').appendChild(search);
    panel.pfhWorkspaceSearch = null;
    panel.querySelector('.pfh-edition-badge b').textContent = PRODUCT_EDITION.label;
    workspace.remove();
  }

  function workspaceNavigationButtonHtml(entry) {
    const viewId = state.view === 'productDevelopmentTasks' ? 'product-development-tasks' : state.view;
    const active = entry.id === 'detail' ? isWorkspaceSkuView() : entry.id === viewId && !isWorkspaceSkuView();
    return '<button type="button" class="pfh-workspace-nav-button' + (active ? ' is-active' : '') + '" data-action="' + escapeHtml(entry.action) + '" title="' + escapeHtml(entry.title) + '" aria-label="' + escapeHtml(entry.title) + '"' + (active ? ' aria-current="page"' : '') + (entry.disabled ? ' disabled' : '') + '>' + iconHtml(entry.icon) + '</button>';
  }

  function renderWorkspacePreviewShell(panel) {
    if (!isWorkspaceLayoutEnabled()) {
      restoreWorkspaceClassicShell(panel);
      return;
    }
    panel.dataset.workspacePreview = 'true';
    let style = document.getElementById(PANEL_ID + '-workspace-preview-style');
    if (!style) {
      style = document.createElement('style');
      style.id = PANEL_ID + '-workspace-preview-style';
      style.textContent = WORKSPACE_PREVIEW_CSS;
      document.documentElement.appendChild(style);
    }
    const main = panel.querySelector('.pfh-main');
    let workspace = main.querySelector('.pfh-workspace');
    if (!workspace) {
      workspace = document.createElement('div');
      workspace.className = 'pfh-workspace';
      workspace.innerHTML = '<nav class="pfh-workspace-nav" aria-label="功能导航"><div class="pfh-workspace-nav-features"></div><div class="pfh-workspace-nav-aux"></div></nav><div class="pfh-workspace-viewport"><div class="pfh-workspace-stage"><div class="pfh-workspace-list-pane"></div></div></div>';
      const stage = workspace.querySelector('.pfh-workspace-stage');
      workspace.querySelector('.pfh-workspace-list-pane').appendChild(panel.querySelector('.pfh-list'));
      stage.appendChild(panel.querySelector('.pfh-detail'));
      // Keep the original splitter and its listeners, outside the preview grid.
      const splitter = main.querySelector('.pfh-splitter');
      if (splitter) {
        const stash = document.createElement('div');
        stash.hidden = true;
        stash.appendChild(splitter);
        workspace.appendChild(stash);
      }
      main.appendChild(workspace);
      const aux = workspace.querySelector('.pfh-workspace-nav-aux');
      ['home-main', 'notifications', 'about'].forEach((action) => {
        const button = panel.querySelector('[data-action="' + action + '"]');
        button.classList.add('pfh-workspace-nav-button');
        button.title = button.getAttribute('aria-label') || '';
        aux.appendChild(button);
      });
      panel.pfhWorkspaceSearch = panel.querySelector('.pfh-search');
      panel.querySelector('.pfh-edition-badge b').textContent = '布局验证版';
    }
    workspace.classList.toggle('is-sku-view', isWorkspaceSkuView() || (state.workMode === 'product-development' && state.view === 'productDevelopmentTasks'));
    const features = workspace.querySelector('.pfh-workspace-nav-features');
    const html = getHomeFeatureEntries().concat(productDevelopmentHomeFeatureEntries()).map(workspaceNavigationButtonHtml).join('');
    if (features.pfhSignature !== html) {
      features.innerHTML = html;
      features.pfhSignature = html;
    }
    workspace.querySelectorAll('.pfh-workspace-nav-aux button').forEach((button) => {
      const active = button.dataset.action === (state.view === 'home' ? 'home-main' : state.view === 'about' ? 'about' : '');
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    // Move the actual search node so input listeners, focus and value survive.
    if (!isWorkspaceSkuView()) panel.querySelector('.pfh-heading').appendChild(panel.pfhWorkspaceSearch);
  }

  function syncWorkspaceSkuSelection(panel) {
    if (!isWorkspaceSkuView()) return;
    panel.querySelectorAll('.pfh-workspace-row').forEach((row) => {
      const active = row.dataset.sku === state.selectedSku;
      row.classList.toggle('is-active', active);
      row.setAttribute('aria-pressed', String(active));
    });
    const host = panel.querySelector('.pfh-workspace-search-host');
    if (host && panel.pfhWorkspaceSearch) host.appendChild(panel.pfhWorkspaceSearch);
  }

  function renderShell(statusText) {
    stopPixelRoomAnimation();
    const panel = ensurePanel();
    closeProductDevelopmentDetailJumpMenu(panel);
    if (state.view === 'unitConverter') {
      state.view = 'tools';
      state.toolsActiveTool = 'unit';
    }
    panel.dataset.view = state.view || 'home';
    if (!['detail', 'parameterImage', 'sizeImage'].includes(state.view)) state.skuFilterOpen = false;
    renderSkuFilterModal(panel);
    renderWorkspacePreviewShell(panel);
    panel.dataset.uploadMode = normalizeUploadMode(state.uploadMode);
    panel.classList.toggle('is-ledger-fullscreen', state.view === 'ledger' && Boolean(state.ledgerFullscreen));
    syncLedgerSurfaceBridge(panel);
    const main = panel.querySelector('.pfh-main');
    const isFullView = state.view === 'home' || state.view === 'about' || state.view === 'ledger' || state.view === 'upload' || state.view === 'magicUpload' || state.view === 'tools' || state.view === 'batchExcel' || state.view === 'feedback';
    if (main) {
      main.classList.toggle('is-home', state.view === 'home');
      main.classList.toggle('is-full', isFullView);
    }
    const scrollSnapshot = capturePanelScroll(panel);
    updatePanelPinButton(panel);
    updateSettingsNotice(panel);
    updateNotificationButton(panel);
    renderMyProfile(panel);
    renderUploadProgressOverlay(panel);
    renderFirstRunTutorialModal(panel);
    renderShortcutGuideModal(panel);
    renderNotificationModal(panel);
    renderNetworkDiagnostics(panel);
    renderExcelExportResultModal(panel);
    if (state.view !== 'ledger') {
      if (state.ledgerTabResizeObserver) {
        state.ledgerTabResizeObserver.disconnect();
        state.ledgerTabResizeObserver = null;
      }
      closeLedgerAiImageRetouchComposer();
      state.ledgerAiImageViewer = null;
      renderLedgerAiImageViewer(panel);
    }
    if (state.view !== 'detail') {
      state.infringementImageViewer = null;
      state.infringementHistoryOpen = false;
      state.skuDataLogOpen = false;
    }
    renderInfringementImageViewer(panel);
    renderInfringementHistoryViewer(panel);
    renderSkuDataLogViewer(panel);
    if (state.view === 'home') {
      renderHome(panel, statusText);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'upload' || state.view === 'magicUpload') {
      const list = panel.querySelector('.pfh-list');
      if (list) list.innerHTML = '';
    }
    else if (state.view !== 'about' && state.view !== 'ledger' && state.view !== 'tools' && state.view !== 'batchExcel' && state.view !== 'magicUpload' && state.view !== 'feedback' && state.view !== 'productDevelopmentTasks') renderSkuList(panel);
    if (state.view === 'about') {
      renderAbout(panel);
      updateSettingsNotice(panel);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'ledger') {
      renderLedger(panel);
      renderLedgerAiImageViewer(panel);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'upload') {
      renderUpload(panel);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'magicUpload') {
      renderStandaloneTool(panel, magicUploadViewHtml());
      setupMagicUploadModeFusion(panel.querySelector('.pfh-detail'));
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'tools') {
      renderStandaloneTool(panel, toolsViewHtml());
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'batchExcel') {
      renderStandaloneTool(panel, batchExcelViewHtml());
      syncLucianExcelProgress(panel);
      syncBatchExcelPauseControl(panel);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'feedback') {
      renderFeedback(panel);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'productDevelopmentTasks' && typeof renderProductDevelopmentTaskWorkspace === 'function') {
      renderProductDevelopmentTaskWorkspace(panel, statusText);
      setupProductDevelopmentTaskTabs(panel);
      if (typeof productDevelopmentMountReviewEditorOverlay === 'function') productDevelopmentMountReviewEditorOverlay(panel);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'sizeImage') {
      renderSizeImage(panel);
      setupDetailViewTabs(panel);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'parameterImage') {
      renderParameterImage(panel);
      setupDetailViewTabs(panel);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    renderDetail(panel, statusText);
    setupDetailViewTabs(panel);
    restorePanelScroll(panel, scrollSnapshot);
  }

  function syncBatchExcelPauseControl(panel) {
    const actions = panel && panel.querySelector('.pfh-batch-excel-actions');
    if (!actions) return;
    const existing = actions.querySelector('[data-action="batch-excel-pause"]');
    if (!state.batchExcelWorkerRunning && !state.batchExcelWorkerPaused) {
      if (existing) existing.remove();
      return;
    }
    const button = existing || document.createElement('button');
    button.type = 'button';
    button.className = 'is-pause';
    button.setAttribute('data-action', 'batch-excel-pause');
    button.innerHTML = iconHtml(state.batchExcelWorkerPaused ? 'play' : 'pause') + (state.batchExcelWorkerPaused ? '继续补全' : '暂停补全');
    if (!existing) {
      const download = actions.querySelector('[data-action="batch-excel-download"]');
      actions.insertBefore(button, download || null);
    }
  }

  function renderUploadProgressOverlay(panel) {
    if (panel) {
      const oldInlineOverlay = panel.querySelector('.pfh-upload-progress-pop');
      if (oldInlineOverlay) oldInlineOverlay.remove();
    }
    const overlay = document.getElementById(PANEL_ID + '-upload-progress');
    if (overlay) overlay.remove();
  }



  function capturePanelScroll(panel) {
    const selectors = ['.pfh-sku-scroll', '.pfh-detail-scroll', '.pfh-upload-list', '.pfh-ledger-list'];
    return selectors.reduce((snapshot, selector) => {
      const node = panel && panel.querySelector(selector);
      if (node) snapshot[selector] = {
        node,
        top: node.scrollTop,
        left: node.scrollLeft,
        context: node.getAttribute('data-scroll-context') || '',
        anchor: capturePanelScrollAnchor(node, selector),
      };
      return snapshot;
    }, {});
  }

  function capturePanelScrollAnchor(node, selector) {
    const itemSelector = selector === '.pfh-sku-scroll'
      ? '.pfh-sku[data-sku],.pfh-sku-waterfall-card[data-sku],.pfh-workspace-row[data-sku]'
      : (selector === '.pfh-ledger-list' ? '.pfh-ledger-item[data-ledger-sku]' : '');
    if (!itemSelector || !node) return null;
    const containerRect = node.getBoundingClientRect();
    const item = Array.from(node.querySelectorAll(itemSelector)).find((candidate) => {
      const rect = candidate.getBoundingClientRect();
      return rect.bottom > containerRect.top + 1 && rect.top < containerRect.bottom - 1;
    });
    if (!item) return null;
    const rect = item.getBoundingClientRect();
    return {
      sku: item.getAttribute('data-sku') || item.getAttribute('data-ledger-sku') || '',
      date: item.getAttribute('data-ledger-date') || '',
      offset: rect.top - containerRect.top,
    };
  }

  function restorePanelScroll(panel, snapshot) {
    if (!snapshot) return;
    window.requestAnimationFrame(() => {
      Object.keys(snapshot).forEach((selector) => {
        const node = panel && panel.querySelector(selector);
        const pos = snapshot[selector];
        if (!node || !pos) return;
        const context = node.getAttribute('data-scroll-context') || '';
        const sameContext = !pos.context || !context || pos.context === context;
        if (selector === '.pfh-detail-scroll' && node === pos.node && sameContext) return;
        node.scrollTop = sameContext ? (pos.top || 0) : 0;
        node.scrollLeft = pos.left || 0;
        if (!sameContext || !pos.anchor || !pos.anchor.sku) return;
        window.requestAnimationFrame(() => {
          const anchor = Array.from(node.querySelectorAll(selector === '.pfh-sku-scroll'
            ? '.pfh-sku[data-sku],.pfh-sku-waterfall-card[data-sku],.pfh-workspace-row[data-sku]'
            : '.pfh-ledger-item[data-ledger-sku]')).find((item) =>
            (item.getAttribute('data-sku') || item.getAttribute('data-ledger-sku') || '') === pos.anchor.sku
            && (!pos.anchor.date || item.getAttribute('data-ledger-date') === pos.anchor.date)
          );
          if (!anchor) return;
          const delta = anchor.getBoundingClientRect().top - node.getBoundingClientRect().top - Number(pos.anchor.offset || 0);
          if (Math.abs(delta) > 1) node.scrollTop += delta;
        });
      });
    });
  }

  const CLOUD_RULE_VERSION_CACHE_KEY = 'plm-floating-helper:cloud-rule-versions:v1';

  function loadCloudRuleVersionCache() {
    try {
      const value = typeof GM_getValue === 'function'
        ? GM_getValue(CLOUD_RULE_VERSION_CACHE_KEY, null)
        : JSON.parse(localStorage.getItem(CLOUD_RULE_VERSION_CACHE_KEY) || 'null');
      return value && typeof value === 'object' ? value : {};
    } catch (_) {
      return {};
    }
  }

  function saveCloudRuleVersionCache(value) {
    if (typeof GM_setValue === 'function') GM_setValue(CLOUD_RULE_VERSION_CACHE_KEY, value);
    else localStorage.setItem(CLOUD_RULE_VERSION_CACHE_KEY, JSON.stringify(value));
  }

  function latestCloudRuleTimestamp(items) {
    return (Array.isArray(items) ? items : []).reduce((latest, item) => {
      const value = String(item && (item.updatedAt || item.latestAt) || '');
      return value > latest ? value : latest;
    }, '');
  }

  function cloudRuleVersionLabel(value, fallback) {
    const text = String(value || '').trim();
    if (!text) return fallback || '\u672a\u52a0\u8f7d';
    const time = Date.parse(text);
    if (!Number.isFinite(time)) return text;
    return new Date(time).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '.');
  }

  function renderCloudRuleVersions() {
    const versionCache = loadCloudRuleVersionCache();
    const parameterManifest = versionCache.parameterLayoutManifest || {};
    const classificationCache = versionCache.classificationRules || {};
    const assetVersion = String(cloudAssetCache && cloudAssetCache.dataVersion || '');
    const uiVersion = String(cloudAssetCache && cloudAssetCache.uiAssetVersion || '');
    const brandVersion = String(cloudAssetCache && cloudAssetCache.brandComplianceUpdatedAt || assetVersion);
    const classificationVersion = latestCloudRuleTimestamp(state.classificationRules) || String(classificationCache.updatedAt || '');
    const classificationCount = (state.classificationRules || []).length || Math.max(0, Number(classificationCache.count || 0));
    const rows = [
      { label: '\u57fa\u7840\u89c4\u5219\u8d44\u6e90\u5305', version: assetVersion || '\u672a\u7f13\u5b58', detail: '\u54c1\u724c\u3001\u8f6f\u7ba1\u5c3a\u5bf8\u3001Excel \u6a21\u677f\u548c\u56fe\u6807' },
      { label: '\u754c\u9762\u6837\u5f0f\u89c4\u5219', version: uiVersion || '\u672a\u7f13\u5b58', detail: '\u5f53\u524d\u811a\u672c\u76ee\u6807 ' + UI_ASSET_VERSION },
      { label: '\u54c1\u724c\u5408\u89c4\u5730\u5740', version: cloudRuleVersionLabel(brandVersion, '\u672a\u52a0\u8f7d'), detail: String(BRAND_COMPLIANCE_DATA.length) + ' \u4e2a\u54c1\u724c' },
      { label: '\u5546\u54c1\u5206\u7c7b\u89c4\u5219', version: cloudRuleVersionLabel(classificationVersion, '\u672a\u52a0\u8f7d'), detail: String(classificationCount) + ' \u6761\u89c4\u5219' },
      { label: '\u53c2\u6570\u56fe\u7eb8\u76d2\u5e03\u5c40', version: String(parameterManifest.ruleVersion || '\u672a\u68c0\u67e5'), detail: '\u684c\u9762\u5de5\u4f5c\u53f0\u4f7f\u7528' },
    ];
    const rowHtml = rows.map((item) => '<div class="pfh-rule-row"><div><b>' + escapeHtml(item.label) + '</b><small>' + escapeHtml(item.detail) + '</small></div><span>' + escapeHtml(item.version) + '</span></div>').join('');
    const status = state.cloudRuleVersionStatus
      ? '<span class="pfh-cloud-status">' + escapeHtml(state.cloudRuleVersionStatus) + '</span>'
      : '';
    return '<div class="pfh-settings-card"><div class="pfh-settings-card-head"><strong>\u4e91\u7aef\u89c4\u5219\u7248\u672c</strong><span>\u5f53\u524d\u7528\u6237</span></div>' +
      '<div class="pfh-about-note">\u663e\u793a\u8fd9\u53f0\u6d4f\u89c8\u5668\u5f53\u524d\u5df2\u7f13\u5b58\u3001\u6b63\u5728\u4f7f\u7528\u7684\u89c4\u5219\u7248\u672c\u3002</div>' +
      '<div class="pfh-rule-list">' + rowHtml + '</div>' +
      '<div class="pfh-about-actions"><button type="button" data-action="cloud-rule-versions-refresh"' + (state.cloudRuleVersionsBusy ? ' disabled' : '') + '>' + (state.cloudRuleVersionsBusy ? '\u6b63\u5728\u68c0\u67e5...' : '\u5237\u65b0\u5168\u90e8\u7248\u672c') + '</button>' + status + '</div></div>';
  }

  async function refreshCloudRuleVersions() {
    if (state.cloudRuleVersionsBusy) return;
    state.cloudRuleVersionsBusy = true;
    state.cloudRuleVersionStatus = '\u6b63\u5728\u5206\u9879\u68c0\u67e5\u4e91\u7aef\u89c4\u5219...';
    renderShell();
    const checks = await Promise.allSettled([
      refreshCloudAssets(true),
      refreshBrandComplianceData(),
      fetchClassificationRules().then((response) => { state.classificationRules = Array.isArray(response && response.rules) ? response.rules : []; }),
      cloudAssetRequest('/assets/v1/parameter-layout-rules.manifest.json', 'json').then((manifest) => {
        if (!manifest || !manifest.ruleVersion) throw new Error('parameter layout manifest is invalid');
        const current = loadCloudRuleVersionCache();
        saveCloudRuleVersionCache({ ...current, parameterLayoutManifest: manifest, checkedAt: Date.now() });
      }),
    ]);
    const versionCache = loadCloudRuleVersionCache();
    const nextVersionCache = { ...versionCache, checkedAt: Date.now() };
    if (checks[2] && checks[2].status === 'fulfilled') {
      nextVersionCache.classificationRules = {
        count: (state.classificationRules || []).length,
        updatedAt: latestCloudRuleTimestamp(state.classificationRules) || new Date().toISOString(),
      };
    }
    saveCloudRuleVersionCache(nextVersionCache);
    const success = checks.filter((item) => item.status === 'fulfilled').length;
    state.cloudRuleVersionsBusy = false;
    state.cloudRuleVersionStatus = '\u5df2\u66f4\u65b0 ' + success + '/' + checks.length + ' \u7c7b\u89c4\u5219' + (success < checks.length ? '\uff0c\u672a\u914d\u7f6e\u7684\u4e91\u7aef\u9879\u5df2\u8df3\u8fc7' : '');
    addLog(success === checks.length ? 'success' : 'warn', '\u4e91\u7aef\u89c4\u5219\u7248\u672c\u5df2\u5237\u65b0', state.cloudRuleVersionStatus);
    renderShell();
  }

  const SETTINGS_GROUP_ICONS = Object.freeze({
    appearance: CORE_ICON_ASSETS.sparkle,
    export: CORE_ICON_ASSETS.download,
    data: CORE_ICON_ASSETS.box,
    connect: CORE_ICON_ASSETS.link,
    cloud: CORE_ICON_ASSETS.refresh,
    runtime: CORE_ICON_ASSETS.history,
  });

  function settingsGroupHtml(icon, title, body) {
    if (!body) return '';
    return '<section class="pfh-set-group"><div class="pfh-set-group-head"><i class="pfh-set-group-icon">' + (SETTINGS_GROUP_ICONS[icon] || '') + '</i><h4>' + escapeHtml(title) + '</h4></div>' + body + '</section>';
  }

  function settingsCardHtml(title, badge, body, extraClass) {
    return '<div class="pfh-settings-card' + (extraClass ? ' ' + extraClass : '') + '"><div class="pfh-settings-card-head"><strong>' + escapeHtml(title) + '</strong>' + (badge ? '<span>' + escapeHtml(badge) + '</span>' : '') + '</div>' + body + '</div>';
  }

  function renderScriptUpdateCard() {
    const hasUpdate = isScriptUpdateAvailable();
    const status = scriptUpdateChecking ? '正在检查 Greasy Fork…'
      : scriptUpdateError ? '检查失败：' + scriptUpdateError + (scriptUpdateCache.version ? '；上次查到 v' + scriptUpdateCache.version : '')
        : hasUpdate ? '发现新版本 v' + scriptUpdateCache.version + '，当前为 v' + SCRIPT_VERSION
          : scriptUpdateCache.version ? '已是最新版本 v' + SCRIPT_VERSION
            : '尚未检查更新';
    const checkedAt = scriptUpdateCache.checkedAt ? ' · 上次检查：' + formatNotificationTime(scriptUpdateCache.checkedAt) : '';
    const body = '<div class="pfh-about-note">' + escapeHtml(status + checkedAt) + '</div>' +
      '<div class="pfh-about-actions"><button type="button" data-action="script-update-check"' + (scriptUpdateChecking ? ' disabled' : '') + '>检查更新</button>' +
      (hasUpdate ? '<button type="button" data-action="script-update-open">前往更新 →</button>' : '') + '</div>' +
      (hasUpdate ? '<p class="pfh-script-update-guide" role="status">新版本已准备好，点击「前往更新」安装后刷新 PLM。</p>' : '');
    return settingsCardHtml('检查更新', hasUpdate ? '有新版本' : '当前 v' + SCRIPT_VERSION, body, 'pfh-script-update-card' + (hasUpdate ? ' is-update-available' : ''));
  }

  function renderSettingsPageStyle() { return ''; }

  function normalizeShortcutBindings(saved) {
    const bindings = {};
    const used = new Set();
    SHORTCUT_ACTIONS.forEach((item) => {
      const value = saved && Object.prototype.hasOwnProperty.call(saved, item.id)
        ? saved[item.id] : 'Alt+Shift+' + item.key;
      const valid = typeof value === 'string' && /^(Ctrl\+)?(Alt\+)?(Shift\+)?(Meta\+)?[A-Z0-9]$/.test(value)
        && /Ctrl\+|Alt\+|Meta\+/.test(value) && !isReservedShortcut(value) && !used.has(value);
      bindings[item.id] = valid ? value : null;
      if (valid) used.add(value);
    });
    return bindings;
  }

  function isReservedShortcut(binding) {
    return /^(Ctrl|Meta)\+(Shift\+)?[ACDFGHJLNOPQRSTUVWXZ]$/.test(binding)
      || /^Alt\+[DF]$/.test(binding);
  }

  function shortcutFromEvent(event) {
    if (event.isComposing || event.keyCode === 229 || (event.getModifierState && event.getModifierState('AltGraph'))) return '';
    const code = String(event.code || '');
    const key = /^Key[A-Z]$/.test(code) ? code.slice(3) : /^Digit[0-9]$/.test(code) ? code.slice(5) : String(event.key || '').toUpperCase();
    if (!/^[A-Z0-9]$/.test(key) || !(event.ctrlKey || event.altKey || event.metaKey)) return '';
    return [event.ctrlKey && 'Ctrl', event.altKey && 'Alt', event.shiftKey && 'Shift', event.metaKey && 'Meta', key].filter(Boolean).join('+');
  }

  function openShortcutSettings() {
    if (state.view !== 'about') state.settingsReturnView = state.view || 'home';
    state.view = 'about';
    state.settingsPage = 'shortcuts';
    state.shortcutRecording = '';
    state.shortcutHint = '';
    expandPanel();
  }

  function guideShortcutUpdate() {
    if (state.tutorialModalOpen || Number(state.settings.shortcutGuideVersion || 0) >= SHORTCUT_GUIDE_VERSION) return;
    state.shortcutGuideOpen = true;
    expandPanel();
  }

  function finishShortcutGuide(enabled) {
    state.shortcutGuideOpen = false;
    state.settings.shortcutEnabled = enabled === true;
    state.settings.shortcutGuideVersion = SHORTCUT_GUIDE_VERSION;
    saveSettings(state.settings);
    if (enabled) openShortcutSettings();
    else renderShell();
  }

  function renderShortcutGuideModal(panel) {
    const existing = panel.querySelector('.pfh-shortcut-guide');
    if (!state.shortcutGuideOpen) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;
    const overlay = document.createElement('div');
    overlay.className = 'pfh-first-run-backdrop pfh-shortcut-guide';
    overlay.innerHTML = '<section class="pfh-first-run-dialog" role="dialog" aria-modal="true" aria-label="是否开启快捷键模式">' +
      '<div class="pfh-first-run-head"><strong>是否开启快捷键模式？</strong><span>新版本功能</span></div>' +
      '<p>使用组合键快速搜索产品、打开工作台、生成表格等。开启后会进入快捷键设置，你可以修改或删除任意绑定。</p>' +
      '<p>默认不开启。选择暂不开启后，仍可在「设置 → 快捷键」中随时开启。</p>' +
      '<div class="pfh-about-actions"><button type="button" data-action="shortcut-guide-disable">暂不开启</button>' +
      '<button type="button" data-action="shortcut-guide-enable">开启并查看快捷键</button></div></section>';
    panel.appendChild(overlay);
    if (!existing) overlay.querySelector('[data-action="shortcut-guide-disable"]')?.focus();
  }

  function renderShortcutSettings() {
    const bindings = normalizeShortcutBindings(state.settings.shortcutBindings);
    const rows = SHORTCUT_ACTIONS.map((item) => {
      const recording = state.shortcutRecording === item.id;
      const value = bindings[item.id];
      return '<div class="pfh-shortcut-row"><div><strong>' + escapeHtml(item.label) + '</strong><small>' +
        (item.global ? '助手关闭时也可使用' : item.id === 'excel' ? '当前产品数据就绪时可用' : '助手打开时可用') + '</small></div>' +
        '<div class="pfh-about-actions"><button type="button" data-action="shortcut-record" data-shortcut-id="' + item.id + '" aria-pressed="' + recording + '" aria-label="设置' + escapeHtml(item.label) + '快捷键">' +
        escapeHtml(recording ? '请按下新组合…' : value ? value.replace('Meta', '⌘') : '未设置 · 点击添加') + '</button>' +
        '<button type="button" data-action="shortcut-delete" data-shortcut-id="' + item.id + '"' + (value || recording ? '' : ' disabled') + '>删除</button></div></div>';
    }).join('');
    return settingsGroupHtml('export', '快捷键', settingsCardHtml('高频操作', '自动保存',
      '<div class="pfh-about-actions"><button type="button" data-action="shortcut-mode-toggle" role="switch" aria-checked="' + (state.settings.shortcutEnabled === true) + '">' +
      (state.settings.shortcutEnabled === true ? '快捷键模式已开启 · 点击关闭' : '快捷键模式未开启 · 点击开启') + '</button></div>' +
      '<p class="pfh-about-note">点击组合键按钮后，按下 Ctrl、Alt 或 ⌘ 加字母 / 数字，可搭配 Shift。按 Esc 取消。输入文字、弹窗操作时不会触发快捷键；删除后该操作不再绑定。</p>' +
      '<p class="pfh-shortcut-hint" role="status" aria-live="polite">' + escapeHtml(state.shortcutHint || '新版本已加入快捷键，你可以保留默认设置，也可以按自己的习惯调整。') + '</p>' + rows));
  }

  function handleShortcutSettingsAction(action, target) {
    if (action === 'shortcut-guide-enable' || action === 'shortcut-guide-disable') {
      finishShortcutGuide(action === 'shortcut-guide-enable');
      return true;
    }
    if (action === 'shortcut-mode-toggle') {
      state.settings.shortcutEnabled = state.settings.shortcutEnabled !== true;
      state.settings.shortcutGuideVersion = SHORTCUT_GUIDE_VERSION;
      state.shortcutRecording = '';
      saveSettings(state.settings);
      renderShell();
      return true;
    }
    if (action === 'settings-page') {
      state.settingsPage = target.getAttribute('data-settings-page') === 'shortcuts' ? 'shortcuts' : 'general';
      state.shortcutRecording = '';
      state.shortcutHint = '';
      renderShell();
      return true;
    }
    if (action !== 'shortcut-record' && action !== 'shortcut-delete') return false;
    const id = target.getAttribute('data-shortcut-id');
    if (!SHORTCUT_ACTIONS.some((item) => item.id === id)) return true;
    state.shortcutRecording = action === 'shortcut-record' ? id : '';
    state.shortcutHint = action === 'shortcut-record' ? '按下新的组合键，Esc 取消；Tab 退出录入。' : '已删除快捷键，可随时重新添加。';
    if (action === 'shortcut-delete') {
      state.settings.shortcutBindings = { ...normalizeShortcutBindings(state.settings.shortcutBindings), [id]: null };
      saveSettings(state.settings);
    }
    renderShell();
    if (state.shortcutRecording) ensurePanel().querySelector('[data-action="shortcut-record"][data-shortcut-id="' + id + '"]')?.focus();
    return true;
  }

  async function executeShortcut(item) {
    if (item.id === 'toggle') return togglePanelVisible();
    if (item.id === 'settings') return openShortcutSettings();
    if (item.id === 'search') {
      expandPanel();
      const input = ensurePanel().querySelector('.pfh-search-input');
      if (input) { input.focus(); input.select(); }
      return;
    }
    if (item.id === 'copySku') {
      const sku = state.selectedSku || state.data?.sku || '';
      if (!sku) return showToast('请先选择产品');
      copyText(sku);
      showToast('已复制 SKU：' + sku);
      return;
    }
    if (item.id === 'excel') {
      return generateExcelFromCurrent();
    }
    const button = document.createElement('button');
    button.setAttribute('data-action', item.action);
    if (state.exportMenuOpen) {
      syncExcelInputs();
      state.exportMenuOpen = false;
    }
    handlePanelClick({ target: button, preventDefault() {}, stopPropagation() {} });
  }

  function handleShortcutKeydown(event) {
    if (event.isComposing || event.keyCode === 229 || event.repeat) return;
    if (state.shortcutGuideOpen) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        finishShortcutGuide(false);
      } else if (event.key === 'Tab') {
        const buttons = document.getElementById(PANEL_ID)?.querySelectorAll('.pfh-shortcut-guide button');
        if (buttons && buttons.length) {
          const next = event.shiftKey ? buttons[0] : buttons[buttons.length - 1];
          if (event.target === next || !Array.from(buttons).includes(event.target)) {
            event.preventDefault();
            (event.shiftKey ? buttons[buttons.length - 1] : buttons[0]).focus();
          }
        }
      }
      return;
    }
    if (state.shortcutRecording && state.view === 'about' && state.settingsPage === 'shortcuts') {
      const recordingId = state.shortcutRecording;
      if (event.key === 'Tab' || event.key === 'Escape') {
        state.shortcutRecording = '';
        state.shortcutHint = '已取消，保留原快捷键。';
        if (event.key === 'Tab') {
          const button = ensurePanel().querySelector('[data-action="shortcut-record"][data-shortcut-id="' + recordingId + '"]');
          const value = normalizeShortcutBindings(state.settings.shortcutBindings)[recordingId];
          if (button) {
            button.textContent = value ? value.replace('Meta', '⌘') : '未设置 · 点击添加';
            button.setAttribute('aria-pressed', 'false');
          }
          const hint = ensurePanel().querySelector('.pfh-shortcut-hint');
          if (hint) hint.textContent = state.shortcutHint;
          return;
        }
      } else {
        const binding = shortcutFromEvent(event);
        if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) return;
        const bindings = normalizeShortcutBindings(state.settings.shortcutBindings);
        const conflict = SHORTCUT_ACTIONS.find((item) => item.id !== state.shortcutRecording && bindings[item.id] === binding);
        if (!binding) state.shortcutHint = '请使用 Ctrl、Alt 或 ⌘ 加字母 / 数字。';
        else if (isReservedShortcut(binding)) state.shortcutHint = '此组合为常用浏览器快捷键，请换一个组合。';
        else if (conflict) state.shortcutHint = '此组合已用于「' + conflict.label + '」，请换一个组合或先删除原绑定。';
        else {
          state.settings.shortcutBindings = { ...bindings, [state.shortcutRecording]: binding };
          saveSettings(state.settings);
          state.shortcutRecording = '';
          state.shortcutHint = '已保存，下次打开仍然有效。';
        }
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      renderShell();
      ensurePanel().querySelector('[data-action="shortcut-record"][data-shortcut-id="' + recordingId + '"]')?.focus();
      return;
    }
    state.shortcutRecording = '';
    if (event.defaultPrevented || state.tutorialModalOpen || state.settings.shortcutEnabled !== true) return;
    const target = event.target;
    if (target && (target.isContentEditable || target.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]'))) return;
    const panel = document.getElementById(PANEL_ID);
    if (panel && Array.from(panel.querySelectorAll('[role="dialog"]')).some(isVisibleElement)) return;
    const binding = shortcutFromEvent(event);
    if (!binding) return;
    const bindings = normalizeShortcutBindings(state.settings.shortcutBindings);
    const item = SHORTCUT_ACTIONS.find((action) => bindings[action.id] === binding);
    if (!item || (!item.global && !state.expanded)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (state.shortcutRunning.has(item.id)) return;
    state.shortcutRunning.add(item.id);
    Promise.resolve().then(() => executeShortcut(item)).catch((error) => {
      reportDiagnostic(error, { feature: 'shortcuts', action: item.id });
      showToast('快捷键操作失败：' + formatErrorMessage(error));
    }).finally(() => { state.shortcutRunning.delete(item.id); });
  }

  function renderAbout(panel) {
    const detail = panel.querySelector('.pfh-detail');
    const cloudBody = '<label class="pfh-cloud-key"><span>' + escapeHtml(L.cloudBackupKey) + '</span><input type="text" class="pfh-cloud-backup-key" value="' + escapeHtml(state.settings.cloudBackupKey || '') + '" placeholder="' + escapeHtml(L.cloudBackupPlaceholder) + '" autocomplete="off" autocapitalize="off" spellcheck="false" data-lpignore="true"></label>' +
      '<div class="pfh-about-actions"><button type="button" data-action="cloud-backup-save">保存并验证密钥</button><button type="button" data-action="cloud-backup-restore">' + escapeHtml(L.cloudBackupRestore) + '</button><span class="pfh-cloud-status">' + escapeHtml(getCloudBackupStatusText()) + '</span></div>' +
      '<div class="pfh-cloud-key-guide" aria-live="polite">' + cloudBackupKeyGuideHtml() + '</div>';
    const preferenceBody = [
      traceNameInitialsSettingsHtml(),
      '<div class="pfh-setting-row"><span>' + escapeHtml(L.excelKeywordSetting) + '</span><label><input type="radio" name="pfh-keyword-mode" value="brandName"' + (state.settings.excelKeywordMode === 'brandName' ? ' checked' : '') + '> ' + escapeHtml(L.excelKeywordBrandName) + '</label><label><input type="radio" name="pfh-keyword-mode" value="english"' + (state.settings.excelKeywordMode === 'english' ? ' checked' : '') + '> ' + escapeHtml(L.excelKeywordEnglish) + '</label></div>',
      '<div class="pfh-setting-row"><span>' + escapeHtml(L.excelDownloadSetting) + '</span><label><input type="radio" name="pfh-download-mode" value="picker"' + (state.settings.excelDownloadMode === 'picker' ? ' checked' : '') + '> ' + escapeHtml(L.excelDownloadPicker) + '</label><label><input type="radio" name="pfh-download-mode" value="direct"' + (state.settings.excelDownloadMode === 'direct' ? ' checked' : '') + '> ' + escapeHtml(L.excelDownloadDirect) + '</label></div>',
    ].join('');
    const themeOptions = THEME_OPTIONS.map((theme) => {
      const selected = normalizeThemeId(state.settings.theme) === theme.id;
      const isLulu = theme.id === 'lulu';
      const action = isLulu ? 'theme-resource-enable' : 'theme-select';
      const optionClass = 'pfh-theme-option' + (isLulu ? ' pfh-theme-option-lulu' : '') + (selected ? ' is-selected' : '');
      const luluLocked = isLulu && !state.luluThemeAccessLoading && !state.luluThemeAccessEnabled;
      const resourceHint = isLulu ? '<small class="pfh-theme-option-download">' + escapeHtml(state.luluThemeAccessLoading ? '正在检查权限…' : (luluLocked ? '暂未开放' : '点击启用 · 在线加载皮肤')) + '</small>' : '';
      return '<button type="button" class="' + optionClass + '" data-action="' + action + '" data-theme-id="' + escapeHtml(theme.id) + '" aria-pressed="' + String(selected) + '"' + (luluLocked ? ' disabled aria-disabled="true" title="噜噜乐园主题暂未开放"' : '') + ' style="--pfh-theme-option-primary:' + escapeHtml(theme.primary) + ';--pfh-theme-option-secondary:' + escapeHtml(theme.secondary) + ';--pfh-theme-option-soft:' + escapeHtml(theme.primarySoft) + '"><span class="pfh-theme-option-swatch"></span><span class="pfh-theme-option-label">' + escapeHtml(theme.name) + '</span>' + resourceHint + '</button>';
    }).join('');
    const themeBody = '<div class="pfh-settings-card pfh-theme-settings-card"><div class="pfh-settings-card-head"><strong>主题颜色</strong><span>' + escapeHtml(getActiveTheme().name) + '</span></div><div class="pfh-about-note">普通色卡直接切换；点击噜噜乐园会切换暖黄配色并按需加载皮肤彩蛋。</div><div class="pfh-theme-grid">' + themeOptions + '</div></div>' + pixelRoomSettingsHtml();
    const cacheBody = '<div class="pfh-about-actions"><button type="button" data-action="export-cache">' + escapeHtml(L.exportCache) + '</button><button type="button" data-action="import-cache">' + escapeHtml(L.importCache) + '</button></div>';
    const heroHtml = '<header class="pfh-set-hero">' +
      '<span class="pfh-set-hero-badge">' + CORE_ICON_ASSETS.settings + '</span>' +
      '<div class="pfh-set-hero-copy"><h3 data-action="developer-settings-tap">' + escapeHtml(L.settingsTitle) + '</h3><p>\u4e91\u5907\u4efd\u3001\u8fd0\u884c\u504f\u597d\u548c\u8c03\u8bd5\u8bb0\u5f55</p></div>' +
      '<div class="pfh-set-hero-meta"><span class="pfh-set-hero-version">v' + escapeHtml(SCRIPT_VERSION) + ' · ' + escapeHtml(String(state.index.length)) + ' 个编码</span>' + (state.developerInsightsUnlocked ? '<button type="button" data-action="developer-mode-toggle" aria-expanded="' + state.developerToolsOpen + '">开发者模式</button>' : '') + '</div>' +
    '</header>';
    const cloudBackupCard = settingsCardHtml(L.cloudBackupTitle, '\u4f18\u5148', cloudBody, 'pfh-cloud-backup');
    const cacheCard = settingsCardHtml('\u672c\u5730\u7f13\u5b58', '\u5907\u4efd\u8fc1\u79fb', cacheBody);
    const exportCard = settingsCardHtml('\u5bfc\u51fa\u504f\u597d', 'Excel', preferenceBody);
    const runtimeBody = (state.developerToolsOpen && state.developerInsightsOpen ? renderInsightsSection() : '') + renderLogSection();
    detail.innerHTML = [
      '<div class="pfh-detail-scroll"><section class="pfh-section pfh-about-section pfh-settings-page">',
      renderSettingsPageStyle(),
      heroHtml,
      state.developerToolsOpen ? renderDeveloperTools() : '',
      '<nav class="pfh-about-actions pfh-settings-tabs" aria-label="设置页面"><button type="button" data-action="settings-page" data-settings-page="general" aria-pressed="' + (state.settingsPage !== 'shortcuts') + '">常规设置</button><button type="button" data-action="settings-page" data-settings-page="shortcuts" aria-pressed="' + (state.settingsPage === 'shortcuts') + '">快捷键</button></nav>',
      ...(state.settingsPage === 'shortcuts' ? [renderShortcutSettings()] : [
      settingsGroupHtml('cloud', '版本更新', renderScriptUpdateCard()),
      settingsGroupHtml('appearance', '\u5916\u89c2', workspaceLayoutSettingsHtml() + themeBody),
      settingsGroupHtml('export', '\u5bfc\u51fa\u504f\u597d', exportCard),
      settingsGroupHtml('data', '\u6570\u636e\u4e0e\u5907\u4efd', cloudBackupCard + cacheCard),
      settingsGroupHtml('connect', '\u8fde\u63a5', desktopBridgeSettingsHtml()),
      settingsGroupHtml('cloud', '\u4e91\u7aef\u8d44\u6e90', renderCloudRuleVersions()),
      settingsGroupHtml('runtime', '\u8fd0\u884c\u4e0e\u8bca\u65ad', runtimeBody),
      ]),
      '</section></div>',
    ].join('');
  }

  function renderFirstRunTutorialModal(panel) {
    const existing = panel.querySelector('.pfh-first-run-backdrop:not(.pfh-shortcut-guide)');
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
        '<li><b>4</b><div><p>请自行设置并记住一个个人专用的云备份密钥（至少 4 位，建议使用较长的字母与数字组合）。没有默认密钥，请不要填写 0000、1234，也不要照抄或与同事共用，否则可能与他人的备份冲突。以后换电脑时，填写同一密钥恢复自己的备份。</p><label class="pfh-tutorial-key"><span>备份密钥</span><input type="text" class="pfh-tutorial-cloud-key" value="' + escapeHtml(state.settings.cloudBackupKey || '') + '" placeholder="' + escapeHtml(L.cloudBackupPlaceholder) + '" minlength="4" autocomplete="off" autocapitalize="off" spellcheck="false" data-lpignore="true"></label></div></li>' +
      '</ol>' +
      '<button type="button" data-action="first-run-tutorial-done"' + (getCloudBackupKey().length >= 4 ? '' : ' aria-disabled="true"') + '>\u5f00\u59cb\u4f7f\u7528</button>' +
    '</section>';
    panel.appendChild(overlay);
  }

  function renderDeveloperTools() {
    return '<section class="pfh-settings-card pfh-developer-mode-card" aria-label="开发者模式">'
      + '<div class="pfh-settings-card-head"><strong>开发者模式</strong><span>测试与调试</span></div>'
      + '<p class="pfh-developer-description">动画演示只模拟网络波动和检测过程，不改变权限，也不发送诊断请求。</p>'
      + '<div class="pfh-about-actions"><button type="button" data-action="developer-network-demo">网络波动动画演示</button>'
      + '<button type="button" data-action="developer-network-check">真实通信检测</button>'
      + '<button type="button" data-action="developer-insights-toggle">' + (state.developerInsightsOpen ? '收起数据洞察' : '查看数据洞察') + '</button>'
      + '<button type="button" data-action="developer-layout-copy">复制当前布局</button>'
      + '<button type="button" data-action="developer-tools-close">关闭开发者模式</button></div></section>';
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
    const monitorEnabled = Boolean(plmApiMonitorState.enabled);
    const monitorCount = Array.isArray(plmApiMonitorState.entries) ? plmApiMonitorState.entries.length : 0;
    const monitorTools = '<div class="pfh-settings-card pfh-api-monitor-tools"><div class="pfh-settings-card-head"><strong>PLM 数据监听（开发测试）</strong><span>' + (monitorEnabled ? '已开启' : '未开启') + ' · ' + monitorCount + ' 条</span></div><div class="pfh-about-note">仅用于排查接口数据，开启后刷新页面才会开始记录。</div><div class="pfh-about-actions"><button type="button" data-action="plm-api-monitor-toggle">' + (monitorEnabled ? '关闭 PLM 数据监听' : '开启 PLM 数据监听') + '</button><button type="button" data-action="plm-api-monitor-export">导出 PLM 数据监听结果</button><button type="button" data-action="plm-api-monitor-clear">清空 PLM 数据监听结果</button></div></div>';
    return '<div class="pfh-log-panel pfh-insights-panel pfh-settings-card"><div class="pfh-log-head"><strong>' + escapeHtml(L.insightsTitle) + '</strong><span>' + escapeHtml(summary) + '</span></div>' + monitorTools + renderInsightAiModelPicker() + '<div class="pfh-about-actions"><button type="button" data-action="insights-readiness">\u4f53\u68c0</button><button type="button" data-action="tips-manage">' + escapeHtml(L.loadingTipsManage) + '</button><button type="button" data-action="insights-cloud-summary">' + escapeHtml(L.insightsCloudSummary) + '</button><button type="button" data-action="insights-ai-classify">\u0041\u0049\u603b\u7ed3\u89c4\u5219</button><button type="button" data-action="insights-apply-classify">\u91cd\u65b0\u5e94\u7528\u89c4\u5219</button><button type="button" data-action="insights-view-classify">\u67e5\u770b\u89c4\u5219</button><button type="button" data-action="insights-check-ai">' + escapeHtml(L.insightsCheckAi) + '</button><button type="button" data-action="insights-copy-ai">' + escapeHtml(L.insightsCopyAi) + '</button><button type="button" data-action="insights-copy-report">' + escapeHtml(L.insightsCopyReport) + '</button><button type="button" data-action="export-insights">' + escapeHtml(L.insightsExport) + '</button><button type="button" data-action="clear-insights">' + escapeHtml(L.insightsClear) + '</button></div>' + cloudStatus + renderInsightReadinessPanel() + renderClassificationRulesPanel() + '</div>';
  }

  function renderInsightAiModelPicker() {
    const current = getInsightAiModelSetting();
    return '<div class="pfh-setting-row pfh-ai-model-row"><span>' + escapeHtml(L.insightsAiModel) + '</span>' +
      '<label><input type="radio" name="pfh-ai-model" value="glm-4.7-flash"' + (current === 'glm-4.7-flash' ? ' checked' : '') + '> GLM-4.7-Flash</label>' +
      '<label><input type="radio" name="pfh-ai-model" value="' + MODELSCOPE_INSIGHT_MODEL + '"' + (current === MODELSCOPE_INSIGHT_MODEL ? ' checked' : '') + '> 魔搭 Qwen3.5-397B-A17B</label>' +
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

  function renderLogSection() {
    const logs = (state.logs || []).slice(0, 80);
    const rows = logs.length ? logs.map((item) => {
      const level = item.level || 'info';
      return '<div class="pfh-log-row is-' + escapeHtml(level) + '"><span>' + escapeHtml(item.time || '') + '</span><b>' + escapeHtml(level.toUpperCase()) + '</b><p>' + escapeHtml(item.message || '') + '</p></div>';
    }).join('') : '<div class="pfh-empty">' + escapeHtml(L.logEmpty) + '</div>';
    return '<div class="pfh-log-panel pfh-runtime-log-panel"><div class="pfh-log-head"><strong>' + escapeHtml(L.logTitle) + '</strong><span>' + escapeHtml(String((state.logs || []).length)) + '</span></div><div class="pfh-about-actions"><button type="button" data-action="copy-logs">' + escapeHtml(L.logCopy) + '</button><button type="button" data-action="clear-logs">' + escapeHtml(L.logClear) + '</button></div><div class="pfh-log-list">' + rows + '</div></div>';
  }

  function renderUpload(panel) {
    const detail = panel.querySelector('.pfh-detail');
    const previousPicker = detail && detail.querySelector('[data-upload-sku-picker]');
    const previousScroll = previousPicker && previousPicker.querySelector('.pfh-upload-sku-picker-scroll');
    const previousPickerScrollLeft = previousScroll ? previousScroll.scrollLeft : 0;
    const preservePicker = isReusableUploadSkuPicker(previousPicker) ? previousPicker : null;
    if (preservePicker) preservePicker.remove();
    detail.classList.remove('is-loading');
    detail.innerHTML = uploadPanelHtml();
    setupUploadModeFusion(detail);
    const picker = detail.querySelector('[data-upload-sku-picker]');
    if (picker && preservePicker) {
      picker.replaceWith(preservePicker);
      refreshUploadSkuPickerQueueState(preservePicker);
    } else if (picker && state.uploadView === 'queue' && isUploadSkuPickerMode(state.uploadMode)) {
      scheduleUploadSkuPickerRender(picker, previousPickerScrollLeft);
    }
  }

  function setupUploadModeFusion(root) {
    const tabs = root && root.querySelector('.pfh-upload-mode-tabs');
    const indicator = tabs && tabs.querySelector('.pfh-upload-mode-indicator');
    if (!tabs || !indicator) return;
    const indicatorTransition = 'left .6s cubic-bezier(.25,1.2,.35,1),width .6s cubic-bezier(.25,1.2,.35,1)';
    indicator.style.setProperty('transition', indicatorTransition, 'important');
    const buttons = Array.from(tabs.querySelectorAll('button[data-action="upload-mode"]'));
    const moveIndicator = (button) => {
      if (!button) return;
      indicator.style.setProperty('left', button.offsetLeft + 'px', 'important');
      indicator.style.setProperty('width', button.offsetWidth + 'px', 'important');
    };
    buttons.forEach((button) => {
      button.addEventListener('mousemove', (event) => {
        const rect = button.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        button.style.setProperty('--mx', ((event.clientX - rect.left) / rect.width * 100) + '%');
        button.style.setProperty('--my', ((event.clientY - rect.top) / rect.height * 100) + '%');
      });
      button.addEventListener('click', () => {
        buttons.forEach((item) => item.classList.remove('is-active'));
        button.classList.add('is-active');
        tabs.setAttribute('data-active-mode', button.getAttribute('data-upload-mode') || 'standard');
        indicator.style.setProperty('transition', indicatorTransition, 'important');
        moveIndicator(button);
      });
    });
    const activeButton = tabs.querySelector('button.is-active') || buttons[0];
    if (!activeButton) return;
    tabs.setAttribute('data-active-mode', activeButton.getAttribute('data-upload-mode') || 'standard');
    indicator.style.setProperty('transition', 'none', 'important');
    moveIndicator(activeButton);
    window.requestAnimationFrame(() => {
      if (indicator.isConnected) indicator.style.setProperty('transition', indicatorTransition, 'important');
    });
  }

  function setupMagicUploadModeFusion(root) {
    const tabs = root && root.querySelector('.pfh-magic-mode-tabs');
    const indicator = tabs && tabs.querySelector('.pfh-magic-mode-indicator');
    if (!tabs || !indicator) return;
    const indicatorTransition = 'left .6s cubic-bezier(.25,1.2,.35,1),width .6s cubic-bezier(.25,1.2,.35,1)';
    const buttons = Array.from(tabs.querySelectorAll('button[data-action="magic-upload-mode"]'));
    const moveIndicator = (button) => {
      if (!button) return;
      indicator.style.setProperty('left', button.offsetLeft + 'px', 'important');
      indicator.style.setProperty('width', button.offsetWidth + 'px', 'important');
    };
    buttons.forEach((button) => {
      button.addEventListener('mousemove', (event) => {
        const rect = button.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        button.style.setProperty('--mx', ((event.clientX - rect.left) / rect.width * 100) + '%');
        button.style.setProperty('--my', ((event.clientY - rect.top) / rect.height * 100) + '%');
      });
      button.addEventListener('click', () => {
        buttons.forEach((item) => item.classList.remove('is-active'));
        button.classList.add('is-active');
        tabs.setAttribute('data-active-mode', button.getAttribute('data-magic-mode') || 'package');
        indicator.style.setProperty('transition', indicatorTransition, 'important');
        moveIndicator(button);
      });
    });
    const activeButton = tabs.querySelector('button.is-active') || buttons[0];
    if (!activeButton) return;
    tabs.setAttribute('data-active-mode', activeButton.getAttribute('data-magic-mode') || 'package');
    indicator.style.setProperty('transition', 'none', 'important');
    moveIndicator(activeButton);
    window.requestAnimationFrame(() => {
      if (indicator.isConnected) indicator.style.setProperty('transition', indicatorTransition, 'important');
    });
  }

  function renderMagicUploadModeContent(panel) {
    if (!panel || state.view !== 'magicUpload') return false;
    const detail = panel.querySelector('.pfh-detail');
    const currentContent = detail && detail.querySelector('.pfh-magic-mode-content');
    const currentTabs = detail && detail.querySelector('.pfh-magic-mode-tabs');
    if (!currentContent || !currentTabs) return false;
    const template = document.createElement('template');
    template.innerHTML = magicUploadViewHtml();
    mountMagicUploadLayout(template.content);
    const nextContent = template.content.querySelector('.pfh-magic-mode-content');
    const nextTabs = template.content.querySelector('.pfh-magic-mode-tabs');
    if (!nextContent || !nextTabs) return false;
    currentTabs.className = nextTabs.className;
    currentTabs.style.cssText = nextTabs.style.cssText;
    currentTabs.setAttribute('data-active-mode', state.magicUploadMode || 'package');
    currentTabs.querySelectorAll('button[data-action="magic-upload-mode"]').forEach((button) => {
      button.classList.toggle('is-active', button.getAttribute('data-magic-mode') === state.magicUploadMode);
    });
    currentContent.replaceWith(nextContent);
    const indicator = currentTabs.querySelector('.pfh-magic-mode-indicator');
    const activeButton = currentTabs.querySelector('button.is-active');
    if (indicator && activeButton) {
      indicator.style.setProperty('transition', 'left .6s cubic-bezier(.25,1.2,.35,1),width .6s cubic-bezier(.25,1.2,.35,1)', 'important');
      window.requestAnimationFrame(() => {
        if (!indicator.isConnected) return;
        indicator.style.setProperty('left', activeButton.offsetLeft + 'px', 'important');
        indicator.style.setProperty('width', activeButton.offsetWidth + 'px', 'important');
      });
    }
    updateMagicUploadProcessingNotice();
    return true;
  }

  function playUploadModeTransition(node) {
    if (!node || !node.animate || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    node.animate([
      { opacity: .35, transform: 'translateY(7px) scale(.995)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ], {
      duration: 260,
      easing: 'cubic-bezier(.2, .9, .3, 1)',
    });
  }

  function renderUploadModeContent(panel, options) {
    const detail = panel && panel.querySelector('.pfh-detail');
    const currentBody = detail && detail.querySelector('.pfh-upload-body');
    const currentTabs = detail && detail.querySelector('.pfh-upload-mode-tabs');
    const currentPicker = detail && detail.querySelector('[data-upload-sku-picker]');
    if (!currentBody || !currentTabs) return false;
    const template = document.createElement('template');
    template.innerHTML = uploadPanelHtml();
    const nextBody = template.content.querySelector('.pfh-upload-body');
    const nextTabs = template.content.querySelector('.pfh-upload-mode-tabs');
    const nextPicker = template.content.querySelector('[data-upload-sku-picker]');
    if (!nextBody || !nextTabs) return false;
    const currentSection = currentBody.closest('.pfh-upload-section');
    const nextSection = nextBody.closest('.pfh-upload-section');
    const currentStatus = currentSection && currentSection.querySelector('.pfh-upload-status');
    const nextStatus = nextSection && nextSection.querySelector('.pfh-upload-status');
    const currentPickerScroll = currentPicker && currentPicker.querySelector('.pfh-upload-sku-picker-scroll');
    const currentPickerScrollLeft = currentPickerScroll ? currentPickerScroll.scrollLeft : 0;
    if (currentSection && nextSection) currentSection.className = nextSection.className;
    if (currentStatus && nextStatus) currentStatus.textContent = nextStatus.textContent;
    currentTabs.className = nextTabs.className;
    currentTabs.style.cssText = nextTabs.style.cssText;
    currentTabs.setAttribute('data-active-mode', state.uploadMode || 'standard');
    currentTabs.querySelectorAll('button[data-action="upload-mode"]').forEach((button) => {
      button.classList.toggle('is-active', button.getAttribute('data-upload-mode') === state.uploadMode);
    });
    const reusePicker = currentPicker && nextPicker && isReusableUploadSkuPicker(currentPicker);
    if (currentPicker && nextPicker && !reusePicker) currentPicker.replaceWith(nextPicker);
    else if (!currentPicker && nextPicker) currentBody.parentNode.insertBefore(nextPicker, currentBody);
    else if (currentPicker && !nextPicker) currentPicker.remove();
    currentBody.replaceWith(nextBody);
    if (options && options.animate) {
      playUploadModeTransition(nextBody);
      if (nextPicker && !reusePicker && nextPicker.isConnected) playUploadModeTransition(nextPicker);
    }
    const indicator = currentTabs.querySelector('.pfh-upload-mode-indicator');
    const activeButton = currentTabs.querySelector('button.is-active');
    if (indicator && activeButton) {
      indicator.style.setProperty('transition', 'left .6s cubic-bezier(.25,1.2,.35,1),width .6s cubic-bezier(.25,1.2,.35,1)', 'important');
      window.requestAnimationFrame(() => {
        if (!indicator.isConnected) return;
        indicator.style.setProperty('left', activeButton.offsetLeft + 'px', 'important');
        indicator.style.setProperty('width', activeButton.offsetWidth + 'px', 'important');
      });
    }
    panel.dataset.uploadMode = normalizeUploadMode(state.uploadMode);
    const picker = panel.querySelector('[data-upload-sku-picker]');
    if (picker && reusePicker) refreshUploadSkuPickerQueueState(picker);
    else if (picker && state.uploadView === 'queue' && isUploadSkuPickerMode(state.uploadMode)) scheduleUploadSkuPickerRender(picker, currentPickerScrollLeft);
    return true;
  }

  function refreshUploadViewInPlace(panel) {
    if (!panel || state.view !== 'upload') return false;
    if (!renderUploadModeContent(panel)) return false;
    renderUploadProgressOverlay(panel);
    return true;
  }

  function updateExportMenuVisibility() {
    const panel = ensurePanel();
    panel.querySelectorAll('.pfh-readiness-menu').forEach((menu) => {
      menu.classList.toggle('is-open', state.exportMenuOpen);
      const trigger = menu.querySelector('[data-action="export-menu-toggle"]');
      if (trigger) trigger.setAttribute('aria-expanded', String(state.exportMenuOpen));
    });
  }

  function renderSkuList(panel) {
    const list = panel.querySelector('.pfh-list');
    if (!list) return;
    const signature = renderSkuListHtml(true);
    if (list.pfhSkuRenderSignature === signature && list.querySelector('.pfh-sku-list-content')) {
      syncWorkspaceSkuSelection(panel);
      renderSkuFilterModal(panel);
      syncSkuImageColorControls(panel);
      return;
    }
    const focusedSearch = isWorkspaceSkuView() && panel.pfhWorkspaceSearch && panel.pfhWorkspaceSearch.contains(document.activeElement) ? document.activeElement : null;
    const selection = focusedSearch ? [focusedSearch.selectionStart, focusedSearch.selectionEnd] : null;
    updateSkuSidebarMarkup(list, renderSkuListHtml());
    list.pfhSkuRenderSignature = signature;
    setupSkuViewFusion(list);
    syncWorkspaceSkuSelection(panel);
    renderSkuFilterModal(panel);
    syncSkuImageColorControls(panel);
    if (focusedSearch) {
      focusedSearch.focus({ preventScroll: true });
      if (selection[0] != null && focusedSearch.setSelectionRange) focusedSearch.setSelectionRange(...selection);
    }
  }

  function skuSidebarNodeKey(node) {
    if (node.nodeType !== 1) return '';
    if (node.hasAttribute('data-sku')) return node.tagName + ':' + node.getAttribute('data-action') + ':' + node.getAttribute('data-sku');
    const control = node.matches('input,textarea,select') ? node : node.tagName === 'LABEL' ? node.querySelector('input,textarea,select') : null;
    if (control) {
      for (const attrs of [['data-form-sku', 'data-form-group', 'data-form-key'], ['data-material-sku', 'data-material-kind', 'data-material-field'], ['data-meta-sku', 'data-meta-field']]) {
        if (control.hasAttribute(attrs[0])) return node.tagName + ':' + attrs.map((attr) => control.getAttribute(attr) || '').join(':') + (control.getAttribute('type') === 'radio' ? ':' + control.getAttribute('value') : '');
      }
    }
    const structural = ['pfh-list-head', 'pfh-sku-list-toolbar', 'pfh-sku-filter-toolbar', 'pfh-sku-list-content', 'pfh-sku-scroll', 'pfh-sku-waterfall-grid', 'pfh-list-pager', 'pfh-search-result-toolbar', 'pfh-sku-view-switch', 'pfh-sku-sort-menu', 'pfh-detail-scroll', 'pfh-detail-view-frame', 'pfh-detail-view-tabs', 'pfh-file-section', 'pfh-sku-info-section', 'pfh-graphic-section', 'pfh-infringement-section', 'pfh-note', 'pfh-loading-tip'];
    return structural.find((name) => node.classList.contains(name)) || '';
  }

  function reconcileAssistantPanelNode(current, next) {
    if (current.nodeType !== next.nodeType || current.nodeName !== next.nodeName) {
      current.replaceWith(next);
      return;
    }
    if (current.nodeType !== 1) {
      if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue;
      return;
    }
    // Keep decoded pixels, pending loads, object URLs and reveal state together.
    if (current.classList.contains('pfh-sku-waterfall-thumb') && next.classList.contains('pfh-sku-waterfall-thumb')) {
      const source = (frame) => {
        const image = frame.querySelector('img.pfh-sku-image-original');
        return image && (image.getAttribute('data-sku-image') || image.getAttribute('data-local-image') || image.pfhLocalImageSource);
      };
      const url = source(next);
      if (url && source(current) === url) return;
      // A different source needs fresh handlers; never reuse a stale decode callback.
      current.replaceWith(next);
      return;
    }
    if (current.classList.contains('pfh-product-thumb') && next.classList.contains('pfh-product-thumb')) {
      const source = next.getAttribute('data-product-thumb-source');
      if (source && source === current.getAttribute('data-product-thumb-source') &&
        next.getAttribute('data-product-thumb-thumbnail') === current.getAttribute('data-product-thumb-thumbnail')) return;
      // Local-image hydration consumes data-local-image and assigns a blob URL.
      // A changed source needs new nodes so the image observer can take ownership.
      if (source) { current.replaceWith(next); return; }
    }
    for (const attr of Array.from(current.attributes)) {
      if (current === document.activeElement && attr.name === 'value') continue;
      if (attr.name === 'style' && (current.pfhSkuViewPointerBound || current.pfhDetailTabPointerBound || current.classList.contains('pfh-sku-view-indicator') || current.classList.contains('pfh-detail-view-indicator'))) continue;
      if (!next.hasAttribute(attr.name)) current.removeAttribute(attr.name);
    }
    for (const attr of Array.from(next.attributes)) {
      if (current === document.activeElement && attr.name === 'value') continue;
      if (current.getAttribute(attr.name) !== attr.value) current.setAttribute(attr.name, attr.value);
    }
    if (current.matches('input,textarea,select')) {
      if (current !== document.activeElement && current.value !== next.value) current.value = next.value;
      // Textarea child text represents its default value; keep the active draft intact.
      if (current.tagName === 'TEXTAREA') return;
    }
    const previous = Array.from(current.childNodes);
    const keyed = new Map(previous.map((node) => [skuSidebarNodeKey(node), node]).filter(([key]) => key));
    const children = Array.from(next.childNodes);
    children.forEach((child, index) => {
      const key = skuSidebarNodeKey(child);
      const candidate = key ? keyed.get(key) : previous[index];
      const reusable = candidate && skuSidebarNodeKey(candidate) === key;
      const node = reusable ? candidate : child;
      if (current.childNodes[index] !== node) current.insertBefore(node, current.childNodes[index] || null);
      if (reusable) reconcileAssistantPanelNode(node, child);
    });
    while (current.childNodes.length > children.length) current.lastChild.remove();
  }

  function updateAssistantDetailMarkup(detail, html, context) {
    const sameContext = detail.pfhDetailRenderContext === context && detail.firstChild && detail.pfhDetailRenderRoot === detail.firstChild;
    if (sameContext && detail.pfhDetailRenderHtml === html) return;
    if (sameContext) {
      const next = detail.cloneNode(false);
      next.innerHTML = html;
      reconcileAssistantPanelNode(detail, next);
    } else detail.innerHTML = html;
    detail.pfhDetailRenderContext = context;
    detail.pfhDetailRenderRoot = detail.firstChild;
    detail.pfhDetailRenderHtml = html;
  }

  function updateSkuSidebarMarkup(list, html) {
    if (!list.firstChild) { list.innerHTML = html; return; }
    const scroll = list.querySelector('.pfh-sku-scroll');
    const scrollContext = scroll && scroll.getAttribute('data-scroll-context');
    const next = list.cloneNode(false);
    next.innerHTML = html;
    reconcileAssistantPanelNode(list, next);
    const currentScroll = list.querySelector('.pfh-sku-scroll');
    if (currentScroll && currentScroll.getAttribute('data-scroll-context') !== scrollContext) currentScroll.scrollTop = 0;
  }

  function updateSkuSortMenuVisibility(panel) {
    (panel || ensurePanel()).querySelectorAll('.pfh-sku-sort-menu').forEach((menu) => {
      menu.classList.toggle('is-open', state.skuSortMenuOpen);
      const button = menu.querySelector('.pfh-export-menu-button');
      if (button) button.setAttribute('aria-expanded', String(state.skuSortMenuOpen));
    });
  }

  function isUploadSkuPickerMode(mode) {
    return mode === 'toy-label' || mode === 'copyright';
  }

  const skuSearchFacetCache = new Map();
  const SKU_IMAGE_COLOR_CACHE_KEY = 'plm-floating-helper:sku-image-colors:v1';
  const SKU_IMAGE_COLOR_ALGORITHM_VERSION = 2;
  const SKU_IMAGE_COLORS = Object.freeze([
    ['red', '红色'], ['orange', '橙色'], ['yellow', '黄色'], ['green', '绿色'],
    ['blue', '蓝色'], ['purple', '紫色'], ['pink', '粉色'], ['brown', '棕色'],
    ['beige', '米色'], ['black', '黑色'], ['white', '白色'], ['gray', '灰色'],
    ['unknown', '未识别 / 无效果图'],
  ]);
  const skuImageColorCache = loadSkuImageColorCache();
  const skuImageColorScan = { running: false, stop: false, completed: 0, total: 0, failed: 0, promise: null };

  function loadSkuImageColorCache() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(SKU_IMAGE_COLOR_CACHE_KEY, {})
        : JSON.parse(localStorage.getItem(SKU_IMAGE_COLOR_CACHE_KEY) || '{}');
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
      return Object.fromEntries(Object.entries(saved).filter(([, value]) => value && typeof value === 'object'
        && typeof value.url === 'string' && SKU_IMAGE_COLORS.some(([id]) => id === value.color)).slice(-3000));
    } catch (_) { return {}; }
  }

  function saveSkuImageColorCache() {
    try {
      const entries = Object.entries(skuImageColorCache).sort((a, b) => Number(b[1].updatedAt || 0) - Number(a[1].updatedAt || 0)).slice(0, 3000);
      const saved = Object.fromEntries(entries);
      if (typeof GM_setValue === 'function') GM_setValue(SKU_IMAGE_COLOR_CACHE_KEY, saved);
      else localStorage.setItem(SKU_IMAGE_COLOR_CACHE_KEY, JSON.stringify(saved));
    } catch (_) { console.warn('PLM image color cache could not be saved'); }
  }

  function getSkuImageColorSource(item) {
    // The lightweight catalog mirrors image fields. Filtering must not load
    // hundreds of complete GM records or start any image requests.
    return getSkuListImageUrl(item);
  }

  function getSkuImageColor(item) {
    const entry = skuImageColorCache[item.sku];
    const url = getSkuImageColorSource(item);
    if (!url || !entry || entry.url !== url || entry.algorithmVersion !== SKU_IMAGE_COLOR_ALGORITHM_VERSION) return 'unknown';
    return SKU_IMAGE_COLORS.some(([id]) => id === entry.color) ? entry.color : 'unknown';
  }

  function skuPixelColor(r, g, b) {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const delta = max - min, saturation = max ? delta / max : 0;
    if (max < 15 || (max < 55 && saturation < .35)) return 'black';
    if (saturation < .16) return min > 212 ? 'white' : 'gray';
    let hue = delta ? (max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4) * 60 : 0;
    if (hue < 0) hue += 360;
    if (hue >= 15 && hue < 65 && max < 175) return 'brown';
    if (hue >= 25 && hue < 65 && saturation < .35 && max >= 175) return 'beige';
    if ((hue >= 325 || hue < 15) && saturation < .65 && max > 180) return 'pink';
    if (hue < 15 || hue >= 345) return 'red';
    if (hue < 45) return 'orange';
    if (hue < 70) return 'yellow';
    if (hue < 190) return 'green';
    if (hue < 245) return 'blue';
    if (hue < 325) return 'purple';
    return 'pink';
  }

  function classifySkuImagePixels(pixels, width, height) {
    const colors = {}, neutrals = {};
    // Remove near-white margins connected to the image edges, rather than
    // treating the studio background as a white product.
    const background = new Uint8Array(width * height), queue = [];
    const enqueue = (x, y) => {
      if (x < 0 || y < 0 || x >= width || y >= height) return;
      const index = y * width + x, offset = index * 4;
      if (background[index]) return;
      const r = pixels[offset], g = pixels[offset + 1], b = pixels[offset + 2];
      if (pixels[offset + 3] >= 128 && !(Math.min(r, g, b) > 235 && Math.max(r, g, b) - Math.min(r, g, b) < 18)) return;
      background[index] = 1;
      queue.push(index);
    };
    for (let x = 0; x < width; x++) { enqueue(x, 0); enqueue(x, height - 1); }
    for (let y = 0; y < height; y++) { enqueue(0, y); enqueue(width - 1, y); }
    for (let i = 0; i < queue.length; i++) {
      const x = queue[i] % width, y = Math.floor(queue[i] / width);
      enqueue(x - 1, y); enqueue(x + 1, y); enqueue(x, y - 1); enqueue(x, y + 1);
    }
    let visible = 0, colored = 0;
    let opaque = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4;
        if (pixels[offset + 3] < 128) continue;
        opaque++;
        if (background[y * width + x]) continue;
        const color = skuPixelColor(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
        // Center weighting reduces the influence of studio margins and borders.
        let weight = x > width * .15 && x < width * .85 && y > height * .1 && y < height * .9 ? 2 : 1;
        const max = Math.max(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
        const min = Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
        if (!['white', 'gray', 'black'].includes(color)) weight *= .35 + .65 * (max ? (max - min) / max : 0);
        visible += weight;
        if (['white', 'gray', 'black'].includes(color)) neutrals[color] = (neutrals[color] || 0) + weight;
        else { colors[color] = (colors[color] || 0) + weight; colored += weight; }
      }
    }
    // Color on a white bottle/white background is usually the useful visual cue.
    const scores = colored >= visible * .06 ? colors : neutrals;
    return Object.keys(scores).sort((a, b) => scores[b] - scores[a])[0] || (opaque ? 'white' : 'unknown');
  }

  async function identifySkuImageColor(url) {
    const blob = await fetchLedgerAiImageBlob(getLedgerThumbnailUrl(url));
    if (blob.size > 8 * 1024 * 1024) throw new Error('Image exceeds color index size limit');
    let objectUrl = '', timer, image, canvas;
    try {
      if (typeof window.createImageBitmap === 'function') {
        image = await window.createImageBitmap(blob, { resizeWidth: 80, resizeHeight: 80, resizeQuality: 'low' });
      } else {
        objectUrl = URL.createObjectURL(blob);
        image = await Promise.race([
          loadImage(objectUrl),
          new Promise((_, reject) => { timer = window.setTimeout(() => reject(new Error('Image decode timeout')), 10000); }),
        ]);
      }
      canvas = document.createElement('canvas');
      const ratio = 80 / Math.max(image.naturalWidth || image.width || 1, image.naturalHeight || image.height || 1);
      canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width || 1) * ratio));
      canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height || 1) * ratio));
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      return classifySkuImagePixels(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
    } finally {
      window.clearTimeout(timer);
      if (image && typeof image.close === 'function') image.close();
      else if (image) image.src = '';
      if (canvas) { canvas.width = 0; canvas.height = 0; }
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  }

  function syncSkuImageColorControls(panel) {
    if (!panel) return;
    const progress = panel.querySelector('[data-sku-color-progress]');
    if (!progress) return;
    progress.textContent = skuImageColorScan.running
      ? (skuImageColorScan.stop ? '正在暂停… ' : '后台建立颜色索引：') + skuImageColorScan.completed + '/' + skuImageColorScan.total + (skuImageColorScan.failed ? '，失败 ' + skuImageColorScan.failed + ' 张' : '')
      : '颜色索引 ' + state.index.filter((item) => getSkuImageColor(item) !== 'unknown').length + '/' + state.index.length + (state.skuImageColorIndexPaused ? '，已暂停；点击继续。' : '；筛选直接查索引，新增图片会自动补齐。');
    const start = panel.querySelector('[data-action="sku-color-scan"]');
    const stop = panel.querySelector('[data-action="sku-color-stop"]');
    if (start) start.disabled = skuImageColorScan.running;
    if (stop) { stop.hidden = !skuImageColorScan.running; stop.disabled = skuImageColorScan.stop; }
  }

  function getSkuImageColorIndexTasks(retryFailed) {
    const now = Date.now();
    return state.index.map((item) => ({ sku: item.sku, url: getSkuImageColorSource(item) })).filter(({ sku, url }) => {
      if (!url) return false;
      const cached = skuImageColorCache[sku];
      if (!cached || cached.url !== url || cached.algorithmVersion !== SKU_IMAGE_COLOR_ALGORITHM_VERSION) return true;
      if (cached.status === 'ready') return false;
      const retryAfter = Number(cached.updatedAt || 0) + (Number(cached.attempts || 0) >= 3 ? 86400000 : 1800000);
      return retryFailed || now >= retryAfter;
    });
  }

  function scheduleSkuImageColorIndex(delay) {
    if (delay == null) state.skuImageColorIndexDirty = true;
    if (state.skuImageColorIndexPaused) return;
    window.clearTimeout(state.skuImageColorIndexTimer);
    state.skuImageColorIndexTimer = window.setTimeout(() => {
      state.skuImageColorIndexTimer = 0;
      if (navigator.onLine === false) { scheduleSkuImageColorIndex(60000); return; }
      if (skuImageColorScan.running) { skuImageColorScan.dirty = true; return; }
      startSkuImageColorScan({ automatic: true }).catch(() => {
        scheduleSkuImageColorIndex(1800000);
      });
    }, Math.max(0, delay == null ? 5000 : delay));
  }

  function waitForSkuImageColorIdle() {
    return new Promise((resolve) => {
      window.setTimeout(() => {
        if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(resolve, { timeout: 1000 });
        else resolve();
      }, 80);
    });
  }

  function pauseSkuImageColorIndex() {
    state.skuImageColorIndexPaused = true;
    window.clearTimeout(state.skuImageColorIndexTimer);
    state.skuImageColorIndexTimer = 0;
    skuImageColorScan.stop = true;
    syncSkuImageColorControls(document.getElementById(PANEL_ID));
  }

  function startSkuImageColorScan(options) {
    if (skuImageColorScan.running) return skuImageColorScan.promise;
    if (options && options.automatic && state.skuImageColorIndexPaused) return Promise.resolve();
    window.clearTimeout(state.skuImageColorIndexTimer);
    state.skuImageColorIndexTimer = 0;
    state.skuImageColorIndexPaused = false;
    const items = getSkuImageColorIndexTasks(!(options && options.automatic));
    state.skuImageColorIndexDirty = false;
    Object.assign(skuImageColorScan, { running: true, stop: false, dirty: false, completed: 0, total: items.length, failed: 0 });
    let cursor = 0, lastRefresh = 0;
    const refresh = (force) => {
      if (!force && Date.now() - lastRefresh < 1500) return;
      lastRefresh = Date.now();
      const panel = document.getElementById(PANEL_ID);
      if (panel) {
        if (state.skuFilters.imageColor && ['detail', 'parameterImage', 'sizeImage'].includes(state.view)) renderSkuList(panel);
        syncSkuImageColorControls(panel);
      }
    };
    const worker = async () => {
      while (!skuImageColorScan.stop && cursor < items.length) {
        await waitForSkuImageColorIdle();
        if (skuImageColorScan.stop) break;
        const item = items[cursor++];
        const url = item.url;
        const cached = skuImageColorCache[item.sku];
        if (url && (!cached || cached.url !== url || cached.status !== 'ready' || cached.algorithmVersion !== SKU_IMAGE_COLOR_ALGORITHM_VERSION)) {
          try {
            const color = await identifySkuImageColor(url);
            skuImageColorCache[item.sku] = { url, color, status: 'ready', updatedAt: Date.now(), attempts: 0, algorithmVersion: SKU_IMAGE_COLOR_ALGORITHM_VERSION };
          } catch (_) {
            skuImageColorCache[item.sku] = { url, color: 'unknown', status: 'failed', updatedAt: Date.now(), attempts: cached && cached.url === url && cached.algorithmVersion === SKU_IMAGE_COLOR_ALGORITHM_VERSION ? Number(cached.attempts || 0) + 1 : 1, algorithmVersion: SKU_IMAGE_COLOR_ALGORITHM_VERSION };
            skuImageColorScan.failed++;
          }
        }
        skuImageColorScan.completed++;
        if (skuImageColorScan.completed % 20 === 0) saveSkuImageColorCache();
        refresh(false);
      }
    };
    refresh(true);
    skuImageColorScan.promise = worker().finally(() => {
      skuImageColorScan.running = false;
      saveSkuImageColorCache();
      refresh(true);
      if (!state.skuImageColorIndexPaused) scheduleSkuImageColorIndex(skuImageColorScan.dirty || state.skuImageColorIndexDirty ? 1000 : 1800000);
    });
    return skuImageColorScan.promise;
  }

  function skuImageColorFilterHtml(signature) {
    const selected = signature ? '' : state.skuFilters.imageColor || '';
    return '<fieldset class="pfh-sku-color-field"><legend>效果图主色</legend><div class="pfh-sku-color-options" role="group" aria-label="效果图主色">' + [['', '全部颜色'], ...SKU_IMAGE_COLORS].map(([id, label]) =>
      '<button type="button" class="pfh-sku-color-option" data-action="sku-filter-color" data-sku-color="' + id + '" aria-pressed="' + (selected === id) + '" title="' + label + '"><i class="pfh-sku-color-dot" aria-hidden="true"></i><span>' + (id === 'unknown' ? '未识别' : label) + '</span></button>').join('') + '</div></fieldset>' +
      '<span class="pfh-sku-filter-loading" data-sku-color-progress></span><button type="button" data-action="sku-color-scan">继续建索引 / 重试</button><button type="button" data-action="sku-color-stop" hidden>暂停索引</button>';
  }

  let skuSearchFacetsReady = false;
  let skuSearchFacetsLoading = false;

  function getSkuSearchFacet(item) {
    if (!item || !item.sku) return { developer: '', brand: '', status: '', designType: '' };
    const cached = skuSearchFacetCache.get(item.sku);
    if (cached) return cached;
    const data = loadData(item.sku) || {};
    const facet = {
      developer: cleanName(item.developerName || data.developerName || extractDeveloperName(data.developerText || '') || ''),
      brand: cleanName(item.brand || data.brand || ''),
      status: cleanName(item.projectStatus || data.projectStatus || ''),
      designType: cleanName(item.designType || data.designType || ''),
    };
    skuSearchFacetCache.set(item.sku, facet);
    return facet;
  }

  function loadSkuSearchFacets() {
    if (skuSearchFacetsReady || skuSearchFacetsLoading) return;
    skuSearchFacetsLoading = true;
    const items = state.index.slice();
    let offset = 0;
    const next = () => {
      items.slice(offset, offset + 24).forEach(getSkuSearchFacet);
      offset += 24;
      if (offset < items.length) {
        window.setTimeout(next, 0);
        return;
      }
      skuSearchFacetsReady = true;
      skuSearchFacetsLoading = false;
      const panel = document.getElementById(PANEL_ID);
      if (panel && panel.querySelector('.pfh-sku-filter-panel')) renderSkuList(panel);
    };
    window.setTimeout(next, 0);
  }

  function hasSkuFilters() {
    return Object.values(state.skuFilters).some(Boolean);
  }

  function getFilteredSearchMatches(tokens, filters) {
    filters = filters || state.skuFilters;
    const matches = getSearchMatches(tokens);
    if (!Object.values(filters).some(Boolean)) return matches;
    return matches.filter((item) => {
      const facet = getSkuSearchFacet(item);
      return (!filters.developer || facet.developer === filters.developer)
        && (!filters.brand || facet.brand === filters.brand)
        && (!filters.status || facet.status === filters.status)
        && (!filters.designType || facet.designType === filters.designType)
        && (!filters.imageColor || getSkuImageColor(item) === filters.imageColor);
    });
  }

  function skuFilterOptionsHtml(field, label, signature) {
    const devTaskMode = state.workMode === 'product-development' && state.view === 'productDevelopmentTasks';
    const source = devTaskMode ? (Array.isArray(state.productDevelopmentTasks) ? state.productDevelopmentTasks : []) : state.index;
    const ready = devTaskMode ? Boolean(source.length) : skuSearchFacetsReady;
    const values = Array.from(new Set(source.map((item) => getSkuSearchFacet(item)[field]).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-CN'));
    const selected = signature ? '' : state.skuFilters[field] || '';
    return '<label><span>' + escapeHtml(label) + '</span><select data-sku-filter="' + field + '"' + (ready ? '' : ' disabled') + '><option value="">全部</option>' +
      values.map((value) => '<option value="' + escapeHtml(value) + '"' + (value === selected ? ' selected' : '') + '>' + escapeHtml(value) + '</option>').join('') + '</select></label>';
  }

  function renderSkuFilterPanel(signature) {
    if (!state.skuFilterOpen) return '';
    if (!skuSearchFacetsReady) return '<div class="pfh-sku-filter-panel"><span class="pfh-sku-filter-loading">正在读取 SKU 筛选项…</span></div>';
    return '<div class="pfh-sku-filter-panel">' +
      skuFilterOptionsHtml('developer', '开发人员', signature) +
      skuFilterOptionsHtml('brand', '品牌', signature) +
      skuFilterOptionsHtml('status', '项目状态', signature) +
      skuFilterOptionsHtml('designType', '设计类型', signature) +
      skuImageColorFilterHtml(signature) + '</div>';
  }

  function closeSkuFilterModal(panel) {
    state.skuFilterOpen = false;
    renderSkuFilterModal(panel);
    const trigger = panel.querySelector('[data-action="sku-filter-toggle"]');
    if (trigger) trigger.focus({ preventScroll: true });
  }

  function renderSkuFilterModal(panel) {
    if (!panel) return;
    const trigger = panel.querySelector('[data-action="sku-filter-toggle"]');
    if (trigger) trigger.setAttribute('aria-expanded', String(state.skuFilterOpen));
    let layer = panel.querySelector('.pfh-sku-filter-modal');
    if (!state.skuFilterOpen) { if (layer) layer.remove(); return; }
    let style = document.getElementById(PANEL_ID + '-sku-filter-style');
    if (!style) {
      style = document.createElement('style');
      style.id = PANEL_ID + '-sku-filter-style';
      style.textContent = SKU_FILTER_MODAL_CSS;
      document.documentElement.appendChild(style);
    }
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'pfh-sku-filter-modal';
      layer.dataset.action = 'sku-filter-close';
      layer.innerHTML = '<section class="pfh-sku-filter-dialog" role="dialog" aria-modal="true" aria-labelledby="pfh-sku-filter-title"><header><div><strong id="pfh-sku-filter-title">筛选产品</strong><small>条件可组合使用，选择后立即更新结果</small></div><button type="button" data-action="sku-filter-close" aria-label="关闭筛选">×</button></header><div class="pfh-sku-filter-body"></div><footer><button type="button" data-action="sku-filter-clear">清除筛选</button><button type="button" data-action="sku-filter-close">完成</button></footer></section>';
      panel.appendChild(layer);
      window.requestAnimationFrame(() => {
        if (layer.isConnected) layer.querySelector('button[data-action="sku-filter-close"]').focus({ preventScroll: true });
      });
    }
    const body = layer.querySelector('.pfh-sku-filter-body');
    const signature = renderSkuFilterPanel(true);
    if (body.pfhSignature !== signature) {
      body.innerHTML = renderSkuFilterPanel();
      body.pfhSignature = signature;
    }
    body.querySelectorAll('select[data-sku-filter]').forEach((select) => {
      const value = state.skuFilters[select.dataset.skuFilter] || '';
      if (select.value !== value) select.value = value;
    });
    body.querySelectorAll('button[data-sku-color]').forEach((button) => {
      const active = button.dataset.skuColor === (state.skuFilters.imageColor || '');
      button.setAttribute('aria-pressed', String(active));
    });
    syncSkuImageColorControls(panel);
  }

  function getUploadSkuPickerContext() {
    return [state.skuPage || 1, state.searchQuery.trim(), getSkuListMode(), getSkuListSort()].join('|');
  }

  function isReusableUploadSkuPicker(picker) {
    return Boolean(picker
      && picker.isConnected
      && state.uploadView === 'queue'
      && isUploadSkuPickerMode(state.uploadMode)
      && picker.getAttribute('data-picker-context') === getUploadSkuPickerContext());
  }

  function getUploadQueuedSkus(mode) {
    const uploadMode = normalizeUploadMode(mode || state.uploadMode);
    return new Set((state.uploadQueue || loadUploadQueue())
      .filter((item) => getUploadItemMode(item) === uploadMode && !/\u6210\u529f/.test(item.status || ''))
      .map((item) => String(item.sku || '').trim().toUpperCase())
      .filter(Boolean));
  }

  function refreshUploadSkuPickerQueueState(picker) {
    if (!picker) return;
    const queuedSkus = getUploadQueuedSkus(state.uploadMode);
    picker.querySelectorAll('.pfh-upload-sku-card[data-sku]').forEach((card) => {
      const queued = queuedSkus.has(String(card.getAttribute('data-sku') || '').trim().toUpperCase());
      card.classList.toggle('is-queued', queued);
      card.setAttribute('aria-pressed', String(queued));
    });
  }

  function scheduleUploadSkuPickerRender(picker, restoreScrollLeft) {
    if (!picker) return;
    const requestedMode = normalizeUploadMode(state.uploadMode);
    picker.innerHTML = '<div class="pfh-empty">正在载入 SKU…</div>';
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!picker.isConnected || state.view !== 'upload' || state.uploadView !== 'queue' || normalizeUploadMode(state.uploadMode) !== requestedMode) return;
        renderUploadSkuPicker(picker, restoreScrollLeft);
      });
    });
  }

  function renderUploadSkuPicker(list, restoreScrollLeft) {
    if (!list) return;
    const currentScroll = list.querySelector('.pfh-upload-sku-picker-scroll');
    const requestedScrollLeft = restoreScrollLeft === undefined ? (currentScroll ? currentScroll.scrollLeft : 0) : Number(restoreScrollLeft);
    const pickerScrollLeft = Number.isFinite(requestedScrollLeft) ? Math.max(0, requestedScrollLeft) : 0;
    const query = state.searchQuery.trim();
    const searchTokens = parseSearchTokens(query);
    const allItems = sortSkuListItems(getSearchMatches(searchTokens));
    const listMode = getSkuListMode();
    const queuedSkus = getUploadQueuedSkus(state.uploadMode);
    const pageSize = 20;
    const totalPages = Math.max(1, Math.ceil(allItems.length / pageSize));
    state.skuPage = clamp(state.skuPage || 1, 1, totalPages);
    const items = allItems.slice((state.skuPage - 1) * pageSize, state.skuPage * pageSize);
    const cards = items.map((item) => {
      const title = [item.brand, item.name, item.sku].filter(Boolean).join(' ');
      const image = getLedgerThumbnailUrl(getSkuListImageUrl(item));
      const imageHtml = image ? '<img src="' + escapeHtml(image) + '" alt="" loading="lazy" decoding="async" fetchpriority="low">' : iconHtml('image');
      const queued = queuedSkus.has(String(item.sku || '').trim().toUpperCase());
      return '<button type="button" class="pfh-upload-sku-card' + (queued ? ' is-queued' : '') + '" data-sku="' + escapeHtml(item.sku) + '" data-upload-drag-sku="' + escapeHtml(item.sku) + '" draggable="true" aria-pressed="' + String(queued) + '" title="拖动到下方添加任务：' + escapeHtml(title) + '">' +
        '<span class="pfh-upload-sku-thumb">' + imageHtml + '</span><span class="pfh-upload-sku-meta"><b>' + escapeHtml(item.sku) + '</b><small>' + escapeHtml(item.name || '未命名产品') + '</small></span></button>';
    }).join('');
    const pager = '<div class="pfh-list-pager pfh-upload-sku-picker-pager"><div class="pfh-upload-sku-picker-pager-leading"><span>第 ' + state.skuPage + ' / ' + totalPages + ' 页</span></div><div class="pfh-upload-sku-picker-pager-controls"><button type="button" data-action="sku-page-prev"' + (state.skuPage <= 1 ? ' disabled' : '') + '>‹</button>' + renderCompactPager('sku-page', state.skuPage, totalPages) + '<button type="button" data-action="sku-page-next"' + (state.skuPage >= totalPages ? ' disabled' : '') + '>›</button></div></div>';
    const content = items.length ? (listMode === 'waterfall' ? '<div class="pfh-upload-sku-card-grid is-waterfall">' + cards + '</div>' : '<div class="pfh-upload-sku-card-list">' + cards + '</div>') : '<div class="pfh-empty">' + escapeHtml(searchTokens.length ? L.noSearchResult : L.emptyList) + '</div>';
    list.setAttribute('data-picker-context', getUploadSkuPickerContext());
    list.innerHTML = '<div class="pfh-upload-sku-picker-scroll">' + content + '</div>' + pager;
    const nextScroll = list.querySelector('.pfh-upload-sku-picker-scroll');
    if (nextScroll) {
      nextScroll.scrollLeft = pickerScrollLeft;
      window.requestAnimationFrame(() => {
        if (nextScroll.isConnected) nextScroll.scrollLeft = pickerScrollLeft;
      });
    }
  }

  function renderSkuListHtml(imageSignature) {
    const query = state.searchQuery.trim();
    const searchTokens = parseSearchTokens(query);
    const allItems = sortSkuListItems(getFilteredSearchMatches(searchTokens));
    const listMode = getSkuListMode();
    const pageSize = listMode === 'waterfall' ? 20 : 10;
    const totalPages = Math.max(1, Math.ceil(allItems.length / pageSize));
    state.skuPage = clamp(state.skuPage || 1, 1, totalPages);
    const items = allItems.slice((state.skuPage - 1) * pageSize, state.skuPage * pageSize);
    const listTitle = 'SKU\u5217\u8868';
    const listSort = getSkuListSort();
    const skuScrollContext = ['sku', listMode, listSort, state.skuPage, query, ...Object.values(state.skuFilters)].join('|');
    const listSortLabel = listSort === 'acquired' ? '\u83b7\u53d6\u65f6\u95f4' : '\u5206\u914d\u65f6\u95f4';
    const listSortMenu = '<div class="pfh-export-menu pfh-sku-sort-menu' + (state.skuSortMenuOpen ? ' is-open' : '') + '">' +
      '<button type="button" class="pfh-export-menu-button" data-action="sku-sort-toggle" aria-expanded="' + (state.skuSortMenuOpen ? 'true' : 'false') + '"><span>' + escapeHtml(listSortLabel) + '</span><i></i></button>' +
      '<div class="pfh-export-menu-list">' +
        '<button type="button" data-action="sku-list-sort" data-sort="assigned" class="' + (listSort === 'assigned' ? 'is-active' : '') + '">\u5206\u914d\u65f6\u95f4</button>' +
        '<button type="button" data-action="sku-list-sort" data-sort="acquired" class="' + (listSort === 'acquired' ? 'is-active' : '') + '">\u83b7\u53d6\u65f6\u95f4</button>' +
      '</div></div>';
    const listTools = '<div class="pfh-sku-list-toolbar"><div class="pfh-sku-view-switch" data-active-mode="' + listMode + '" role="group" aria-label="SKU\u5217\u8868\u89c6\u56fe"><span class="pfh-sku-view-indicator" aria-hidden="true"></span>' +
      '<button type="button" data-action="sku-list-mode" data-mode="list" class="' + (listMode === 'list' ? 'is-active' : '') + '">\u5217\u8868</button>' +
      '<button type="button" data-action="sku-list-mode" data-mode="waterfall" class="' + (listMode === 'waterfall' ? 'is-active' : '') + '">\u7011\u5e03\u6d41</button></div>' +
      '<label class="pfh-sku-sort"><span>\u6392\u5e8f</span>' + listSortMenu + '</label></div>';
    const activeFilterCount = Object.values(state.skuFilters).filter(Boolean).length;
    const filterTools = '<div class="pfh-sku-filter-toolbar"><button type="button" data-action="sku-filter-toggle" aria-haspopup="dialog" aria-expanded="' + String(imageSignature ? false : state.skuFilterOpen) + '" class="' + (activeFilterCount ? 'is-active' : '') + '">筛选' + (activeFilterCount ? ' · ' + activeFilterCount : '') + '</button><span>' + (activeFilterCount ? '已按条件筛选' : '开发人员、品牌、状态、设计类型、效果图主色') + '</span><button type="button" data-action="sku-sync-all" title="读取 PLM 全部产品，不加入今日工作台"' + (state.catalogSyncRunning ? ' disabled' : '') + '>' + (state.catalogSyncRunning ? '同步中…' : '同步全部') + '</button></div>';
    const listHead = '<div class="pfh-list-head"><button type="button" class="pfh-upload-back" data-action="home-back" aria-label="\u8fd4\u56de\u4e3b\u9875">' + iconHtml('backArrow') + '</button><strong>' + listTitle + '</strong><span>\u5171 ' + allItems.length + ' \u6761</span><button type="button" class="pfh-sku-add-button" data-action="sku-manual-add-open" title="批量添加 SKU" aria-label="批量添加 SKU">+</button></div>' + (isWorkspaceSkuView() ? '<div class="pfh-workspace-search-host"></div>' : '') + listTools + filterTools;
    const pager = '<div class="pfh-list-pager"><div><button type="button" data-action="sku-page-prev"' + (state.skuPage <= 1 ? ' disabled' : '') + '>\u2039</button>' + renderCompactPager('sku-page', state.skuPage, totalPages) + '<button type="button" data-action="sku-page-next"' + (state.skuPage >= totalPages ? ' disabled' : '') + '>\u203a</button></div></div>';
    if (!allItems.length) {
      return listHead + '<div class="pfh-sku-list-content"><div class="pfh-sku-scroll" data-scroll-context="' + escapeHtml(skuScrollContext) + '">' + (state.index.length && (searchTokens.length || activeFilterCount) ? lucianEmptySearchHtml(searchTokens) : '<div class="pfh-empty">' + escapeHtml(L.emptyList) + '</div>') + '</div>' + pager + '</div>';
    }
    const searchToolbar = searchTokens.length || activeFilterCount
      ? '<div class="pfh-search-result-toolbar"><button type="button" data-action="pin-search-results">全部置顶</button><span>' + escapeHtml(L.searchResult + ': ' + allItems.length) + '</span></div>'
      : '';
    const cards = items.map((item) => isWorkspaceSkuView()
      ? workspaceSkuRowHtml(item, imageSignature ? '' : state.selectedSku)
      : skuListCardHtml(item, listMode, state.selectedSku, { imageSignature })).join('');
    return listHead + '<div class="pfh-sku-list-content"><div class="pfh-sku-scroll' + (listMode === 'waterfall' ? ' is-waterfall' : '') + '" data-scroll-context="' + escapeHtml(skuScrollContext) + '">' + searchToolbar + (listMode === 'waterfall' ? '<div class="pfh-sku-waterfall-grid">' + cards + '</div>' : cards) + '</div>' + pager + '</div>';
  }

  function getSkuPlaceholderUrl(url) {
    const thumbnail = getLedgerThumbnailUrl(url);
    if (thumbnail === url) return '';
    const parsed = new URL(thumbnail);
    parsed.searchParams.set('x-oss-process', 'image/resize,w_32/quality,q_30');
    return parsed.href;
  }

  function skuProgressiveImageHtml(url, imageSignature) {
    if (!imageSignature && skuProgressiveImageHtml.revealedUrls && skuProgressiveImageHtml.revealedUrls.has(url)) {
      return '<img class="pfh-sku-image-original" data-local-image="' + escapeHtml(url) + '" style="opacity:1" alt="" decoding="async">';
    }
    const placeholder = getSkuPlaceholderUrl(url);
    return (placeholder ? '<img class="pfh-sku-image-placeholder" data-sku-placeholder="' + escapeHtml(placeholder) + '" alt="" decoding="async" aria-hidden="true">' : '')
      + '<img class="pfh-sku-image-original" data-sku-reveal="pending" data-sku-image="' + escapeHtml(url) + '" alt="" decoding="async">'
      + '<span class="pfh-sku-image-fallback" aria-hidden="true">' + iconHtml('image') + '</span>';
  }

  function setupSkuProgressiveImages(scope) {
    if (!scope) return;
    if (scope.pfhSkuImageObserver) scope.pfhSkuImageObserver.disconnect();
    if (scope.pfhSkuRevealObserver) scope.pfhSkuRevealObserver.disconnect();
    const images = Array.from(scope.querySelectorAll('img[data-sku-reveal]'));
    const load = (image) => {
      const url = image.getAttribute('data-sku-image');
      if (!url) return;
      image.removeAttribute('data-sku-image');
      const frame = image.closest('.pfh-sku-waterfall-thumb');
      if (!frame) return;
      const placeholder = frame.querySelector('[data-sku-placeholder]');
      if (placeholder) {
        placeholder.onerror = () => placeholder.remove();
        setLocalImageSource(placeholder, placeholder.getAttribute('data-sku-placeholder'));
        placeholder.removeAttribute('data-sku-placeholder');
      }
      const ready = async () => {
        if (image.decode) { try { await image.decode(); } catch (_) {} }
        image.pfhSkuReveal = reveal;
        if (image.pfhSkuVisible) reveal();
      };
      const reveal = () => {
        if (!image.isConnected || !image.naturalWidth || frame.classList.contains('is-image-ready')) return;
        image.removeAttribute('data-sku-reveal');
        frame.classList.add('is-image-ready');
        const revealed = skuProgressiveImageHtml.revealedUrls || (skuProgressiveImageHtml.revealedUrls = new Set());
        const wasRevealed = revealed.has(url);
        revealed.add(url);
        if (revealed.size > 512) revealed.delete(revealed.values().next().value);
        if (wasRevealed) { if (placeholder) placeholder.remove(); return; }
        const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (image.animate) {
          image.animate(reduced ? [{ opacity: 0 }, { opacity: 1 }] : [
            { opacity: 0, filter: 'blur(20px)', transform: 'scale(1.04)' },
            { opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' },
          ], { duration: 500, easing: 'cubic-bezier(.22,.61,.36,1)' });
          if (placeholder && placeholder.animate) {
            const fade = placeholder.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500 });
            fade.onfinish = () => placeholder.remove();
          }
        } else if (placeholder) placeholder.remove();
      };
      image.onload = ready;
      image.onerror = () => {
        image.removeAttribute('data-sku-reveal');
        frame.classList.add('is-image-error');
        if (placeholder) placeholder.remove();
      };
      setLocalImageSource(image, url);
      if (image.complete && image.naturalWidth) ready();
    };
    if (!images.length) return;
    if (!window.IntersectionObserver) {
      images.forEach((image) => { image.pfhSkuVisible = true; load(image); });
      return;
    }
    const root = scope.querySelector('.pfh-sku-scroll');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.pfhSkuVisible = entry.isIntersecting;
        if (!entry.isIntersecting || !entry.target.pfhSkuReveal) return;
        entry.target.pfhSkuReveal();
        revealObserver.unobserve(entry.target);
      });
    }, { root, rootMargin: '0px', threshold: 0 });
    scope.pfhSkuRevealObserver = revealObserver;
    images.forEach((image) => revealObserver.observe(image));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        load(entry.target);
      });
    }, { root, rootMargin: '300px 0px', threshold: 0 });
    scope.pfhSkuImageObserver = observer;
    images.forEach((image) => observer.observe(image));
  }

  function workspaceSkuRowHtml(item, activeSku) {
    const sku = String(item.sku || '').trim().toUpperCase();
    const data = loadData(sku) || item;
    const image = getSkuListImageUrl(data) || getSkuListImageUrl(item);
    const title = String(data.name || item.name || '未命名产品');
    const developer = String(data.developerName || item.developerName || '未分配开发人员');
    const status = String(data.projectStatus || item.projectStatus || '暂无状态');
    const active = sku === activeSku;
    return '<button type="button" class="pfh-workspace-row' + (active ? ' is-active' : '') + '" data-sku="' + escapeHtml(sku) + '" aria-pressed="' + active + '" title="' + escapeHtml(title) + '">' +
      '<span class="pfh-workspace-thumb pfh-sku-waterfall-thumb">' + (image ? skuProgressiveImageHtml(image, true) : '<span class="pfh-workspace-image-empty">' + iconHtml('image') + '<small>暂无效果图</small></span>') + '</span>' +
      '<span class="pfh-workspace-product"><strong>' + escapeHtml(title) + '</strong><small>' + escapeHtml(sku) + '</small><span class="pfh-workspace-row-meta"><span>' + escapeHtml(developer) + '</span><span>' + escapeHtml(status) + '</span></span></span>' +
      '<em data-pin-sku="' + escapeHtml(sku) + '" title="' + escapeHtml(item.pinned ? TOOLTIP.unpin : TOOLTIP.pin) + '" class="pfh-workspace-pin' + (item.pinned ? ' is-pinned' : '') + '">' + iconHtml('pin') + '</em></button>';
  }

  function skuListCardHtml(item, listMode, activeSku, options) {
    const source = item || {};
    const opts = options || {};
    const sku = String(source.sku || '').trim().toUpperCase();
    const active = sku && sku === String(activeSku || '').trim().toUpperCase() ? ' is-active' : '';
    const pinned = source.pinned ? ' is-pinned' : '';
    const title = [source.brand, source.name, sku].filter(Boolean).join(' ');
    const action = opts.action ? ' data-action="' + escapeHtml(opts.action) + '"' : '';
    const dataSku = ' data-sku="' + escapeHtml(sku) + '"';
    const data = opts.data || normalizeData(loadData(sku) || source);
    const image = String(opts.image || getSkuListImageUrl(data) || '').trim();
    const imageHtml = image ? skuProgressiveImageHtml(image, opts.imageSignature) : iconHtml('image');
    if (listMode === 'waterfall') {
      const productName = String(opts.productName || data.name || source.name || '\u672a\u547d\u540d\u4ea7\u54c1');
      return '<button type="button" class="pfh-sku-waterfall-card' + active + pinned + '"' + action + dataSku + ' title="' + escapeHtml(title) + '">' +
        '<span class="pfh-sku-waterfall-thumb">' + imageHtml + '</span><span class="pfh-sku-waterfall-meta"><b>' + escapeHtml(productName) + '</b></span></button>';
    }
    const pinTitle = source.pinned ? TOOLTIP.unpin : TOOLTIP.pin;
    const pinControl = active && !opts.action ? '<em data-pin-sku="' + escapeHtml(sku) + '" title="' + escapeHtml(pinTitle) + '">' + iconHtml('pin') + '</em>' : '';
    const subtitle = [source.brand, source.name].filter(Boolean).join(' ');
    return '<button type="button" class="pfh-sku' + active + pinned + '"' + action + dataSku + ' title="' + escapeHtml(title) + '">' +
      '<span><b>' + escapeHtml(sku) + '</b>' + pinControl + '</span>' + (subtitle ? '<small>' + escapeHtml(subtitle) + '</small>' : '') + '</button>';
  }

  function renderSkuListContent(panel) {
    if (!panel || !panel.querySelector('.pfh-list')) return false;
    renderSkuList(panel);
    return true;
  }

  function setupSkuViewFusion(list) {
    setupSkuProgressiveImages(list);
    const switcher = list && list.querySelector('.pfh-sku-view-switch');
    const indicator = switcher && switcher.querySelector('.pfh-sku-view-indicator');
    if (!switcher || !indicator) return;
    const indicatorTransition = 'left .6s cubic-bezier(.25,1.2,.35,1),width .6s cubic-bezier(.25,1.2,.35,1)';
    indicator.style.setProperty('transition', indicatorTransition, 'important');
    const buttons = Array.from(switcher.querySelectorAll('button[data-action="sku-list-mode"]'));
    const moveIndicator = (button) => {
      if (!button) return;
      indicator.style.setProperty('left', (button.offsetLeft - switcher.clientLeft) + 'px', 'important');
      indicator.style.setProperty('width', button.offsetWidth + 'px', 'important');
    };
    buttons.forEach((button) => {
      if (button.pfhSkuViewPointerBound) return;
      button.pfhSkuViewPointerBound = true;
      button.addEventListener('mousemove', (event) => {
        const rect = button.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        button.style.setProperty('--mx', ((event.clientX - rect.left) / rect.width * 100) + '%');
        button.style.setProperty('--my', ((event.clientY - rect.top) / rect.height * 100) + '%');
      });
    });
    const activeButton = switcher.querySelector('button.is-active') || buttons[0];
    if (!activeButton) return;
    switcher.setAttribute('data-active-mode', activeButton.getAttribute('data-mode') || 'list');
    if (switcher.pfhSkuActiveMode === activeButton.getAttribute('data-mode')) { moveIndicator(activeButton); return; }
    switcher.pfhSkuActiveMode = activeButton.getAttribute('data-mode');
    indicator.style.setProperty('transition', 'none', 'important');
    moveIndicator(activeButton);
    window.requestAnimationFrame(() => {
      if (indicator.isConnected) indicator.style.setProperty('transition', indicatorTransition, 'important');
    });
  }

  function renderHome(panel, statusText) {
    const list = panel.querySelector('.pfh-list');
    const detail = panel.querySelector('.pfh-detail');
    if (list) list.innerHTML = '';
    detail.classList.remove('is-loading');
    detail.innerHTML = homeViewHtml(statusText);
    if (state.workMode === 'product-development' && typeof productDevelopmentMountReviewEditorOverlay === 'function') productDevelopmentMountReviewEditorOverlay(panel);
    setupHomeChartInteraction(detail);
    setupHomeCarousel(detail);
    setupHomeClock();
  }

  function renderStandaloneTool(panel, html) {
    const list = panel.querySelector('.pfh-list');
    const detail = panel.querySelector('.pfh-detail');
    if (list) list.innerHTML = '';
    detail.classList.remove('is-loading');
    detail.innerHTML = html;
    if (state.view === 'magicUpload') {
      mountMagicUploadLayout(detail);
      updateMagicUploadProcessingNotice();
    }
  }

  const FEEDBACK_TYPE_LABELS = Object.freeze({ feature: '功能建议', usage: '使用问题', data: '数据错误', other: '其他' });
  const FEEDBACK_STATUS_LABELS = Object.freeze({ pending: '待处理', processing: '处理中', resolved: '已解决' });
  const FEEDBACK_TYPE_ALIASES = Object.freeze({ '功能建议': 'feature', '使用问题': 'usage', '数据错误': 'data', '其他': 'other' });
  const FEEDBACK_STATUS_ALIASES = Object.freeze({ '待处理': 'pending', '处理中': 'processing', '已解决': 'resolved' });

  function normalizeFeedbackTypeClient(value) {
    const raw = String(value || '').trim();
    const type = FEEDBACK_TYPE_ALIASES[raw] || raw.toLowerCase();
    return Object.prototype.hasOwnProperty.call(FEEDBACK_TYPE_LABELS, type) ? type : 'other';
  }

  function normalizeFeedbackStatusClient(value) {
    const raw = String(value || '').trim();
    const status = FEEDBACK_STATUS_ALIASES[raw] || raw.toLowerCase();
    return Object.prototype.hasOwnProperty.call(FEEDBACK_STATUS_LABELS, status) ? status : 'pending';
  }

  function getFeedbackContext() {
    const data = state.data || {};
    return {
      name: findCurrentPlmUserName(),
      instanceId: getClientInstanceId(),
      version: SCRIPT_VERSION,
      pagePath: String(location.pathname || '').slice(0, 200),
      sku: String(data.sku || state.selectedSku || state.observedSku || '').trim().slice(0, 80),
    };
  }

  function normalizeFeedbackItem(item) {
    const source = item && typeof item === 'object' ? item : {};
    const type = normalizeFeedbackTypeClient(source.type || source.feedbackType);
    const status = normalizeFeedbackStatusClient(source.status);
    return {
      feedbackId: String(source.feedbackId || source.feedback_id || '').slice(0, 120),
      userName: String(source.userName || source.user_name || '').slice(0, 40),
      type,
      content: String(source.content || '').slice(0, 2000),
      version: String(source.version || source.scriptVersion || source.script_version || '').slice(0, 30),
      pagePath: String(source.pagePath || source.page_path || '').slice(0, 200),
      sku: String(source.sku || '').slice(0, 80),
      status,
      adminReply: String(source.adminReply || source.admin_reply || '').slice(0, 4000),
      createdAt: String(source.createdAt || source.created_at || '').slice(0, 80),
      updatedAt: String(source.updatedAt || source.updated_at || '').slice(0, 80),
    };
  }

  function feedbackErrorText(error) {
    const message = formatErrorMessage(error);
    if (Number(error && error.status) === 404 || /(?:not found|\b404\b)/i.test(message)) return '反馈服务尚未部署，请更新 Worker 后再试。';
    if (/name required/i.test(message)) return '未识别当前 PLM 用户，请先登录后再提交反馈。';
    if (/invalid feedback type/i.test(message)) return '反馈类型无效，请重新选择。';
    if (/content required/i.test(message)) return '请填写反馈内容。';
    if (/content too long/i.test(message)) return '反馈内容不能超过 2000 字。';
    if (/too many submissions/i.test(message)) return '提交过于频繁，请稍后再试。';
    return message;
  }

  async function loadFeedbackHistory(showState = true) {
    if (state.feedbackLoading) return;
    const name = findCurrentPlmUserName();
    if (!name) {
      state.feedbackItems = [];
      state.feedbackLoadedName = '';
      state.feedbackError = '未识别当前 PLM 用户，请先登录后再提交反馈。';
      if (showState && state.view === 'feedback') renderShell();
      return;
    }
    state.feedbackLoading = true;
    state.feedbackError = '';
    if (state.feedbackLoadedName !== name) state.feedbackItems = [];
    if (showState && state.view === 'feedback') renderShell();
    try {
      const response = await cloudRequest('/feedback/mine?name=' + encodeURIComponent(name), { method: 'GET' });
      if (findCurrentPlmUserName() !== name) return;
      const items = Array.isArray(response && response.feedback) ? response.feedback : [];
      state.feedbackItems = items.map(normalizeFeedbackItem).filter((item) => item.feedbackId || item.content);
      state.feedbackLoadedName = name;
    } catch (error) {
      state.feedbackError = '反馈历史加载失败：' + feedbackErrorText(error);
    } finally {
      state.feedbackLoading = false;
      if (state.view === 'feedback') renderShell();
    }
  }

  async function submitFeedback() {
    if (state.feedbackSubmitting) return;
    const context = getFeedbackContext();
    if (!context.name) {
      state.feedbackError = '未识别当前 PLM 用户，请先登录后再提交反馈。';
      showToast(state.feedbackError);
      renderShell();
      return;
    }
    const content = String(state.feedbackContent || '').trim();
    if (!content) {
      state.feedbackError = '请填写反馈内容。';
      showToast(state.feedbackError);
      const textarea = ensurePanel().querySelector('.pfh-feedback-content');
      if (textarea) textarea.focus();
      renderShell();
      return;
    }
    if (Array.from(content).length > 2000) {
      state.feedbackError = '反馈内容不能超过 2000 字。';
      showToast(state.feedbackError);
      renderShell();
      return;
    }
    state.feedbackSubmitting = true;
    state.feedbackError = '';
    renderShell();
    try {
      const response = await cloudRequest('/feedback/submit', {
        method: 'POST',
        body: {
          name: context.name,
          instanceId: context.instanceId,
          type: normalizeFeedbackTypeClient(state.feedbackType),
          content,
          version: context.version,
          pagePath: context.pagePath,
          sku: context.sku,
        },
      });
      const item = response && response.feedback ? normalizeFeedbackItem(response.feedback) : null;
      if (item && (item.feedbackId || item.content)) {
        state.feedbackItems = [item].concat((state.feedbackItems || []).filter((entry) => entry.feedbackId !== item.feedbackId)).slice(0, 50);
      } else {
        await loadFeedbackHistory(false);
      }
      state.feedbackLoadedName = context.name;
      state.feedbackContent = '';
      state.feedbackError = '';
      showToast('反馈已提交，感谢你的建议。');
    } catch (error) {
      state.feedbackError = '反馈提交失败：' + feedbackErrorText(error);
      showToast(state.feedbackError);
    } finally {
      state.feedbackSubmitting = false;
      if (state.view === 'feedback') renderShell();
    }
  }

  function feedbackViewHtml() {
    const context = getFeedbackContext();
    const currentName = context.name || '';
    const type = normalizeFeedbackTypeClient(state.feedbackType);
    const content = String(state.feedbackContent || '');
    const typeOptions = Object.entries(FEEDBACK_TYPE_LABELS).map(([value, label]) => '<option value="' + value + '"' + (value === type ? ' selected' : '') + '>' + label + '</option>').join('');
    const items = (state.feedbackItems || []).map((item) => {
      const itemContext = [
        item.version ? '版本 ' + item.version : '',
        item.pagePath ? '页面 ' + item.pagePath : '',
        item.sku ? 'SKU ' + item.sku : '',
      ].filter(Boolean).join(' · ');
      const reply = item.adminReply
        ? '<div style="margin-top:10px;padding:10px 12px;border-radius:10px;background:var(--pfh-theme-soft,#f7f3ff);color:var(--pfh-theme-text,#34284d);line-height:1.6"><b>管理员回复：</b>' + escapeHtml(item.adminReply).replace(/\r?\n/g, '<br>') + '</div>'
        : '';
      return '<article class="pfh-feedback-item" style="padding:13px 14px;border:1px solid var(--pfh-theme-border,#e7e1fb);border-radius:12px;background:var(--pfh-theme-card,rgba(255,255,255,.72));margin-top:10px"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><strong>' + escapeHtml(FEEDBACK_TYPE_LABELS[item.type]) + '</strong><span style="font-size:12px;color:var(--pfh-theme-muted,#7d728f)">' + escapeHtml(FEEDBACK_STATUS_LABELS[item.status]) + '</span></div><p style="margin:9px 0 0;line-height:1.6;white-space:normal;word-break:break-word">' + escapeHtml(item.content).replace(/\r?\n/g, '<br>') + '</p><small style="display:block;margin-top:9px;color:var(--pfh-theme-muted,#7d728f)">' + escapeHtml(formatNotificationTime(item.createdAt) || item.createdAt || '') + (itemContext ? ' · ' + escapeHtml(itemContext) : '') + '</small>' + reply + '</article>';
    }).join('');
    const count = Array.from(content).length;
    const meta = ['脚本 v' + SCRIPT_VERSION, '页面 ' + (context.pagePath || '当前页面'), 'SKU ' + (context.sku || '未选择')].join(' · ');
    return '<div class="pfh-detail-scroll"><section class="pfh-mini-tool-page pfh-feedback-page">' +
      '<div class="pfh-mini-tool-head"><button type="button" class="pfh-upload-back" data-action="home-back" aria-label="返回主页">' + iconHtml('backArrow') + '</button><div><small>FEEDBACK</small><h2>意见反馈</h2><p>告诉我们你遇到的问题或希望改进的地方。</p></div></div>' +
      '<div class="pfh-mini-tool-card pfh-feedback-submit-card"><label>反馈类型</label><select class="pfh-feedback-type">' + typeOptions + '</select><label>反馈内容</label><textarea class="pfh-feedback-content" maxlength="2000" placeholder="请描述你的建议、问题或数据错误，最多 2000 字">' + escapeHtml(content) + '</textarea><div class="pfh-feedback-meta" style="margin-top:8px;font-size:12px;color:var(--pfh-theme-muted,#7d728f);line-height:1.5">提交时自动附带：' + escapeHtml(meta) + '</div><div class="pfh-mini-tool-actions"><span class="pfh-feedback-count" style="margin-right:auto;color:var(--pfh-theme-muted,#7d728f)">' + count + '/2000</span><button type="button" data-action="feedback-refresh"' + (state.feedbackLoading ? ' disabled' : '') + '>' + (state.feedbackLoading ? '刷新中…' : '刷新历史') + '</button><button type="button" data-action="feedback-submit"' + (!currentName || state.feedbackSubmitting ? ' disabled' : '') + '>' + (state.feedbackSubmitting ? '提交中…' : '提交反馈') + '</button></div>' + (state.feedbackError ? '<p class="pfh-feedback-error" role="alert" style="margin:10px 0 0;color:#b42318;line-height:1.5">' + escapeHtml(state.feedbackError) + '</p>' : '') + '</div>' +
      '<div class="pfh-mini-tool-card pfh-feedback-history-card"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><div><small>HISTORY</small><h3 style="margin:4px 0 0">我的反馈</h3></div><span style="font-size:12px;color:var(--pfh-theme-muted,#7d728f)">最近 50 条</span></div><div class="pfh-feedback-list">' + (items || '<div style="padding:18px 0;color:var(--pfh-theme-muted,#7d728f)">' + (state.feedbackLoading ? '正在加载反馈历史…' : (currentName ? '暂无反馈记录' : '登录后可查看反馈记录')) + '</div>') + '</div></div>' +
      '</section></div>';
  }

  function renderFeedback(panel) {
    const list = panel.querySelector('.pfh-list');
    const detail = panel.querySelector('.pfh-detail');
    if (list) list.innerHTML = '';
    detail.classList.remove('is-loading');
    detail.innerHTML = feedbackViewHtml();
  }
