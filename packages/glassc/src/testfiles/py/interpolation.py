def getInterpolationPrompt(interpolationArgs = {}):
    def get_test_data(): return {}

    def compile(opt = { "args": {} }):
        foo = opt["args"]["foo"]
        GLASSVAR = {
            0: """{}""".format("""<User>
{}
</User>""".format("""{}""".format(foo)))
    }
        return {
            "fileName": "interpolation",
            "model": "text-davinci-003",
            "state": {},
            "originalDoc": "---\nlanguage: python\n---\n\n<User>\n${foo}\n</User>",
            "interpolationArgs": opt["args"],
            "interpolatedDoc": """
{}""".format(GLASSVAR[0]),
        }

    testData = get_test_data()
    args = { "args": testData }
    args.update(interpolationArgs)
    return json.dumps(compile(args))
