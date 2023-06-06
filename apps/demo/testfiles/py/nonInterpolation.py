def getNonInterpolationPrompt(interpolationArgs = {}):
    def get_test_data(): return {}
    
    def compile(opt = { "args": {} }):
        foo = opt["args"]["foo"]
        GLASSVAR = {
            0: """{}""".format("""<User>
{}
</User>""".format("""{} and {{foo}}""".format(foo)))
    }
        return {
            "fileName": "nonInterpolation",
            "requestBlocks": [  ],
            "state": {},
            "originalDoc": "---\nlanguage: python\n---\n\n<User>\n${foo} and {foo}\n</User>",
            "interpolationArgs": opt["args"],
            "interpolatedDoc": """
{}""".format(GLASSVAR[0]),
        }
    
    testData = get_test_data()
    testData.update(interpolationArgs)
    return json.dumps(compile({ "args": testData }))
