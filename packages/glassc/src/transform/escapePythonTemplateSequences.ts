/**
 * Takes a string like this:
 *
 * ```
 * {} foo is {bar} and {baz}
 * ```
 *
 * And escaped any sequences that look like non-empty Python template sequences, so the example above becomes
 *
 * ```
 * {} foo is {{bar}} and {{baz}}
 * ```
 *
 * Empty template sequences are ignored. This function works for nested sequences as well:
 *
 * ```
 * { foo: {} }
 * ```
 *
 * becomes
 *
 * ```
 * {{ foo: {{}} }}
 * ```
 */
export function escapePythonTemplateSequences(str: string) {
  const stack: number[] = []
  let output = ''

  for (let i = 0; i < str.length; i++) {
    if (str[i] === '{') {
      stack.push(output.length)
      output += str[i]
    } else if (str[i] === '}') {
      if (stack.length > 0) {
        const start = stack.pop()
        if (start !== undefined) {
          // If this was a non-empty sequence or an empty sequence nested inside another sequence
          if (output.slice(start + 1, output.length).trim() !== '' || stack.length > 0) {
            // Insert an additional '{' to escape it
            output = output.slice(0, start) + '{' + output.slice(start)
            output += str[i]
            output += '}' // Insert an additional '}' to escape it
          } else {
            output += str[i]
          }
        }
      } else {
        output += str[i]
      }
    } else {
      output += str[i]
    }
  }

  return output
  // const stack: number[] = []
  // let output = ''

  // for (let i = 0; i < str.length; i++) {
  //   if (str[i] === '{') {
  //     stack.push(output.length)
  //     output += str[i]
  //   } else if (str[i] === '}') {
  //     if (stack.length > 0) {
  //       const start = stack.pop()
  //       if (start !== undefined) {
  //         // Check if this was a non-empty sequence
  //         if (output.slice(start + 1, output.length).trim() !== '') {
  //           // Insert an additional '{' to escape it
  //           output = output.slice(0, start) + '{' + output.slice(start)
  //           output += str[i]
  //           output += '}' // Insert an additional '}' to escape it
  //         } else {
  //           output += str[i]
  //         }
  //       }
  //     } else {
  //       output += str[i]
  //     }
  //   } else {
  //     output += str[i]
  //   }
  // }

  // return output
}
