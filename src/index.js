export default function(options = {}) {
  return {
    renderer: {
      code: (code, infostring) => {
        // More modern versions of markedjs use an object here
        /* istanbul ignore next */
        if (typeof code === 'object') {
          infostring = code.lang;
          code = code.text;
        }

        if (infostring !== 'annotated-hexdump') {
          /* istanbul ignore next */
          return false;
        }

        // Now parse the input, build the hex output, and output the result

        return `<pre><code class="language-annotated-hexdump">${code}</code></pre>`;
      },
    },
  };
}
