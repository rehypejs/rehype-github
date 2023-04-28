# HSL

*   Plain text: hsl(0, 0%, 0%)
*   Code: `hsl(0, 0%, 0%)`
*   Alpha: `hsl(0, 0%, 0%, 0.5)`
*   No percentage on s: `hsl(0, 0, 0%)`
*   No percentage on l: `hsl(0, 0%, 0)`
*   Alpha, no leading zero: `hsl(0, 0%, 0%, .5)`
*   Alpha, more than 1: `hsl(0, 0%, 0%, 2)`
*   Alpha, percentage: `hsl(0, 0%, 0%, 20%)`
*   No whitespace after commas: `hsl(0,0%,0%)`
*   Whitespace before commas: `hsl( 0 , 0% , 0% )`
*   No commas: `hsl(0 0% 0%)`
*   Hue: deg: `hsl(1deg 20% 50%)`
*   Hue: rad: `hsl(1rad 20% 50%)`
*   Hue: grad: `hsl(1grad 20% 50%)`
*   Hue: turn: `hsl(1turn 20% 50%)`
*   Alpha, slash: `hsl(0 0% 0% / 0.2)`
*   Alpha, slash, percentage: `hsl(0 0% 0% / 80%)`
*   Uppercase hsl: `HSL(1, 2%, 3%)`
*   Padding both: ` hsl(1, 2%, 3%) `
*   Padding both, double: `  hsl(1, 2%, 3%)  `
*   Hue, 4 digits: `hsl(1234, 2%, 3%)`
*   Hue, decimals?: `hsl(1.337, 2%, 3%)`
*   Hue, no digit after dot?: `hsl(1., 2%, 3%)`
*   Hue, just a dot?: `hsl(., 2%, 3%)`
*   Hue, empty?: `hsl(, 2%, 3%)`
*   Hue, negative?: `hsl(-1, 2%, 3%)`
*   Saturation: 4 digits: `hsl(1, 1234%, 3%)`
*   Saturation, decimals before percentage?: `hsl(1, 1.337%, 3%)`
*   Saturation, no digit after dot before percentage?: `hsl(1, 2.%, 3%)`
*   Saturation, just a dot before percentage?: `hsl(1, .%, 3%)`
*   Saturation, empty before percentage?: `hsl(1, %, 3%)`
*   Saturation, empty?: `hsl(1, , 3%)`
*   Saturation, negative?: `hsl(1, -2%, 3%)`

Legacy `hsla`:

*   `hsla`: `hsla(0, 0%, 0%, 0.5)`
*   No alpha: `hsla(0, 0%, 0%)`
*   Slash: `hsla(0 0% 0% / 0.5)`
*   Uppercase hsla: `HSLA(1, 2%, 3%, 0.4)`
*   Padding both: ` hsla(0, 0%, 0%, 0.5) `
*   Padding both, double: `  hsla(0, 0%, 0%, 0.5)  `
