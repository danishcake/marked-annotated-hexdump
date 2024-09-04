# marked-annotated-hexdump

Generate annotated hexdumps using markdown. Supports marked and markdown-it

![](./.img/ExampleOutput.png)

[Give marked support a try in your browser](https://danishcake.github.io/marked-annotated-hexdump/marked)

[Give markdown-it support a try in your browser](https://danishcake.github.io/marked-annotated-hexdump/markdown-it)

## Syntax

Annotated hexdumps are created with an `annotated-hexdump` code-block.

````markdown
```annotated-hexdump
0000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F
0010 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F
```
````

![](./.img/Example1.png)

You can omit the address, and it'll assume data starts at offset 0.

````markdown
```annotated-hexdump
00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F
00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F
```
````

![](./.img/Example2.png)

Addresses do not need to be contiguous, or in any particular order.
The only restriction is that you cannot define a range twice. Space will be left for any missing characters.

````markdown
```annotated-hexdump
0010 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F
0100 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F
0028 28 29 30
```
````

![](./.img/Example3.png)

The character used to replace missing bytes can be controlled with `/missing`.

````markdown
```annotated-hexdump
/missing ?

0010 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F
0100 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F
0028 28 29 30
```
````

![](./.img/Example4.png)

The width of the data and address elements in the hexdump can be controlled with `/width` and `/awidth`. `/width` accepts values between 2 and 32. `/awidth` accepts values between 2 and 8. Both are measured in bytes.

````markdown
```annotated-hexdump
/width 4
/awidth 3
0000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F
```
````

![](./.img/Example5.png)

You can highlight regions of a hexdump with `/highlight`. This takes 2/3 arguments:

-   An inclusive range of addresses to highlight. This is enclosed in square brackets `[]`, and can contain single addresses, or ranges delimited with a colon. Multiple ranges (or single addresses) can be combined with commas.
    -   `[1]` - defines a address 0x01 only
    -   `[1,2,3]` - defines a highlight over 0x01, 0x02 and 0x03. This will be rendered with gaps between the highlights.
    -   `[1:3]` - defines a contiguous highlight over the same three bytes.
    -   `[1:3, 100:200]` - defines two contiguous highlights.
-   A style in the form `/N`, where N is a number between 0 and 15.
-   An optional text string, which will be added as a note describing the highlighted region, and will be highlighted
    in the same colour.

````markdown
```annotated-hexdump
0010 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F
0100 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F
0028 28 29 30

/highlight [10,11,12,16:19] /1
/highlight [1F:101] /2
/highlight [104:106] /3
/highlight [1E:1F] /4 A text description
```
````

![](./.img/Example6.png)

You can leave comments by starting a line with `#`. This only works if it's the first character in a line.

You can leave visible notes with the `/note` command. This takes two arguments:

-   A style in the form of `/N`, where N is a number between 0 and 15.
-   A block of text, which will be formatted in this style.

![](./.img/Example7.png)

You can enable the display of decoded text with the `/decode` command. This takes a single optional argument specify the codepage to decode the bytes using. If omitted, this defaults to 1252.

The spacing between the data and the decoded text can be set with `/decode_gap X`. It defaults to 1, and accepts a range between 0 and 128.

The rendering of control characters (0-31 and 127) can be set using `/decode_control X`, where X is the single character to replace the control character. It defaults to '.'.

````markdown
```annotated-hexdump
0000 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F
0010 44 45 52 50
007F 7F
0080 80 81 82 83 84 85 86 87 88 89 8A 8B 8C 8D 8E 8F

/highlight [0:1F,7F] /0 These are control characters
/highlight [10:13] /1 These as low ASCII characters
/highlight [80:8F] /2 These as high characters, affected by the codepage
```
````

![](./.img/Example8.png)

## Usage with marked

````js
import { marked } from "marked";
import { annotatedHex } from "marked-annotated-hexdump/marked";

// or UMD script
// <script src="https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/marked-annotated-hexdump/lib/index.umd.js"></script>

marked.use(annotatedHex());

// Optionally, you can pass a configuration object
// marked.use(annotatedHex({ strict: false }));

marked.parse("```annotated-hexdump\nAA BB CC DD\n```");
````

## Usage with markdown-it

````js
import markdownIt from "../../node_modules/markdown-it/dist/markdown-it";
import {
	extendMarkdownIt,
	annotatedHex,
} from "marked-annotated-hexdump/markdown-it";

// extendMarkdownIt adds to the available highlighters
// and doesn't replace them
const md = markdownIt();
extendMarkdownIt(md);
// Optionally, you can pass a configuration object
// extendMarkdownIt(md, { strict: false }));

// You can also pass extendMarkdownIt to md.use
// md.use(extendMarkdownIt);
// md.use(extendMarkdownIt, { strict: false });

// You can use simple, non-extending version of the plugin. This is useful if you
// only intend to highlight hexdumps, or have your own plumbing for extending markdown-it
// md.use(annotatedHex);
// md.use(annotatedHex, { strict: false });

md.render("```annotated-hexdump\nAA BB CC DD\n```");
````

## Configuration

The `annotatedHex` has an optional configuration object that can be used to customize behaviour.

| Field  | Default | Description                                                                                                                |
| ------ | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| strict | true    | If true, syntax/parsing errors will cause an exception to be thrown.<br> If false, an error will be reported in the output |

# Limitations

-   If you configure your markdown to wrap, the highlighted regions will be at incorrect positions.<br>
    This might be better expressed using spans rather than an svg overlay
- Decoded text often maps to characters that don't have monospaced characters defined, and therefore look uneven and may be highlighted incorrectly.
- The SVG overlay breaks text selection

# Contributing guide

Releases are generated using [Semantic Release](https://semantic-release.gitbook.io/semantic-release), so it's important to use Angular comments. In particular, start the commit message with:

| Prefix                      | Example                                                        | Version change |
| --------------------------- | -------------------------------------------------------------- | -------------- |
| fix:                        | fix: Fix output                                                | 0.0.1          |
| feat:                       | feat: Add /x command                                           | 0.1.0          |
| any<br><br>BREAKING CHANGE: | fix: Improve quality<br><br>BREAKING CHANGE: Remove /x command | 1.0.0          |

Where `any` is one of `[fix,feat,build,ci,docs,perf,refactor]`

Write the summary in the present tense (fix not fixed).
