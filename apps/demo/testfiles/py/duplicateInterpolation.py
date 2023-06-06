def getDuplicateInterpolationPrompt(interpolationArgs = {}):
    def get_test_data(): return {}
    
    def compile(opt = { "args": {} }):
        foo = opt["args"]["foo"]
        bar = opt["args"]["bar"]
        GLASSVAR = {
            0: """{}""".format("""<User>
{}
</User>""".format("""{} {} {}
{}""".format(foo, bar, foo, bar)))
    }
        return {
            "fileName": "duplicateInterpolation",
            "requestBlocks": [  ],
            "state": {},
            "originalDoc": "---\nlanguage: python\n---\n\n<User>\n${foo} ${bar} ${foo}\n${bar}\n</User>",
            "interpolationArgs": opt["args"],
            "interpolatedDoc": """
{}""".format(GLASSVAR[0]),
        }
    
    testData = get_test_data()
    testData.update(interpolationArgs)
    return json.dumps(compile({ "args": testData }))
