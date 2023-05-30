def getBasicPrompt(interpolationArgs = {}):
    def get_test_data(): return {}

    def compile(opt = { "args": {} }):

        GLASSVAR = {
            0: """{}""".format("""<User>
{}
</User>""".format("""foo""".format()))
    }
        return {
            "fileName": "basic",
            "model": "text-davinci-003",
            "state": {},
            "originalDoc": "---\nlanguage: python\n---\n\n<User>\nfoo\n</User>",
            "interpolationArgs": opt["args"],
            "interpolatedDoc": """
{}""".format(GLASSVAR[0]),
        }

    testData = get_test_data()
    args = { "args": testData }
    args.update(interpolationArgs)
    return json.dumps(compile(args))
