def getMultipleInterpolationPrompt():
    def getTestData():
        return {}
    
    def compile(opt = { "args": {} }):
        foo = opt["args"]["foo"]
        bar = opt["args"]["bar"]
        GLASSVAR = {
            0: """{}""".format("""<Prompt>
{}
</Prompt>""".format("""{} {}""".format(foo, bar)))
    }
        return {
            "fileName": "multipleInterpolation",
            "model": "text-davinci-003",
            "state": {},
            "originalDoc": "<Prompt>\n${foo} ${bar}\n</Prompt>",
            "interpolatedDoc": """{}""".format(GLASSVAR[0]),
        }
    
    return json.dumps(compile())
