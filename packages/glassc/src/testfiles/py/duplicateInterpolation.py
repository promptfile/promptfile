def getDuplicateInterpolationPrompt(interpolationArgs = {}):
    def get_test_data(): return {}
    
    def compile(opt = { "args": {} }):
        foo = opt["args"]["foo"]
        bar = opt["args"]["bar"]
        GLASSVAR = {
            0: """{}""".format("""<Prompt>
{}
</Prompt>""".format("""{} {} {}
{}""".format(foo, bar, foo, bar)))
    }
        return {
            "fileName": "duplicateInterpolation",
            "model": "text-davinci-003",
            "state": {},
            "originalDoc": "---\nlanguage: python\n---\n\n<Prompt>\n${foo} ${bar} ${foo}\n${bar}\n</Prompt>",
            "interpolationArgs": opt["args"],
            "interpolatedDoc": """
{}""".format(GLASSVAR[0]),
        }
    
    testData = get_test_data()
    args = { "args": testData }
    args.update(interpolationArgs)
    return json.dumps(compile(args))
