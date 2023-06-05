def getMultipleInterpolationPrompt(interpolationArgs = {}):
    def get_test_data(): return {}
    
    def compile(opt = { "args": {} }):
        foo = opt["args"]["foo"]
        bar = opt["args"]["bar"]
        GLASSVAR = {
            0: """{}""".format("""<User>
{}
</User>""".format("""{} {}""".format(foo, bar)))
    }
        return {
            "fileName": "multipleInterpolation",
            "model": "gpt-3.5-turbo",
            "state": {},
            "originalDoc": "---\nlanguage: python\n---\n\n<User>\n${foo} ${bar}\n</User>",
            "interpolationArgs": opt["args"],
            "interpolatedDoc": """
{}""".format(GLASSVAR[0]),
        }
    
    testData = get_test_data()
    args = { "args": testData }
    args.update(interpolationArgs)
    return json.dumps(compile(args))
