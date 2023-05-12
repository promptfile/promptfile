// THIS FILE WAS GENERATED BY GLASS -- DO NOT EDIT!

import { interpolateGlassChat } from '@glass-lang/interpolator'

import { hello } from '../blah'

export async function getPlaygroundPrompt() {
  const res = await fetch('https://elliottburris.com')
  return res.text()
  const interpolations = {
    0: hello,
  }
  const TEMPLATE =
    'import {hello} from "./blah"\n\n<Code>\nconst res = await fetch("https://elliottburris.com");\nreturn res.text();\n</Code>\n\n<User>\nHi there!\n\nthis is great!\n</User>\n\n<System>\nHello, how are you?\n</System>\n\n<User>\nAwesome, \n###\n```python\nimport requests\ndef go():\n    r = requests.get("hello")\n    return "hello"\n```\n###\n</User>\n\n<System>\nqwefoij\n</System>\n\n<Assistant name="teehee">\n${0}\n</Assistant>\n\n<Assistant name="hi">\ntell me more!\n</Assistant>\n\n<User>\nThis is great, thanks!\n</User>\n\n<User>\nawesome\n</User>'
  return interpolateGlassChat('playground', TEMPLATE, interpolations)
}

export function getSimpleChatPrompt(args: { query: string }) {
  const { query } = args

  const interpolations = {
    0: query,
  }
  const TEMPLATE =
    '<System>\nYou are a highly-intelligent AI.\n\nPlease respond in valid JSON with the following format:\n```js\n{\n    "response": string,\n    "confidence": number // 1 (least confident) to 10 (most confident)\n}\n```\n</System>\n\n<User>\n${0}\n</User>'
  return interpolateGlassChat('simple-chat', TEMPLATE, interpolations)
}

import { sayHello } from '../sayHello'

export async function getTestPrompt() {
  const res = await fetch('https://elliottburris.com')
  const text = res.text()
  const interpolations = {
    0: (function (foo) {
      return 5
    })(),
  }
  const TEMPLATE =
    '<System>\nHello, how are you?\nThis is great, thanks!\n</System>\n\nimport {sayHello} from \'./sayHello\'\n\n<Code>\nconst res = await fetch("https://elliottburris.com")\nconst text = res.text();\n</Code>\n\n<User>\n\n</User>\n\n<System>\nYou are a helpful assistant.\n${0}\n\n## hello\n\nUser: blah\nAssistant: teehee\n</System>\n\n<User>\nHello\n</User>'
  return interpolateGlassChat('test', TEMPLATE, interpolations)
}

import { sayHello } from '../sayHello'

export function getWithImportPrompt() {
  const interpolations = {
    0: sayHello({ name: 'john' }),
  }
  const TEMPLATE =
    "import {sayHello} from './sayHello'\n\n<System>\nYou are a helpful assistant.\n</System>\n\n<User>\n${0}\n</User>"
  return interpolateGlassChat('with-import', TEMPLATE, interpolations)
}

export const Glass = {
  playground: getPlaygroundPrompt,
  simpleChat: getSimpleChatPrompt,
  test: getTestPrompt,
  withImport: getWithImportPrompt,
}