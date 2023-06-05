def getTestblockPrompt(interpolationArgs = {}):
    def get_test_data():
        foo = 'tell me a story'
        return {'foo': foo}
    
    def compile(opt = { "args": {} }):
        foo = opt["args"]["foo"]
        GLASSVAR = {
            0: """{}""".format("""<Test>
{}
</Test>""".format("""foo = "tell me a story\"""".format())),
            1: """{}""".format("""<System>
{}
</System>""".format("""{}""".format(foo))),
            2: """{}""".format("""<Request model="gpt-3.5-turbo">
{}
</Request>""".format("""""".format()))
    }
        return {
            "fileName": "testblock",
            "model": "gpt-3.5-turbo",
            "state": {},
            "originalDoc": "---\nlanguage: python\n---\n\n<Test>\nfoo = \"tell me a story\"\n</Test>\n\n<System>\n${foo}\n</System>\n\n<Request model=\"gpt-3.5-turbo\" />",
            "interpolationArgs": opt["args"],
            "interpolatedDoc": """
{}

{}

{}""".format(GLASSVAR[0], GLASSVAR[1], GLASSVAR[2]),
        }
    
    testData = get_test_data()
    args = { "args": testData }
    args.update(interpolationArgs)
    return json.dumps(compile(args))
