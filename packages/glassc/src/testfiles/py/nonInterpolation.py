def getNonInterpolationPrompt():
    def getTestData():
        return {}
    
    def compile(opt = { "args": {} }):
        foo = opt["args"]["foo"]
        GLASSVAR = {
            0: """{}""".format("""<Prompt>
{}
</Prompt>""".format("""{} and {{foo}}""".format(foo)))
    }
        return {
            "fileName": "nonInterpolation",
            "model": "text-davinci-003",
            "state": {},
            "originalDoc": "<Prompt>\n${foo} and {foo}\n</Prompt>",
            "interpolatedDoc": """{}""".format(GLASSVAR[0]),
        }
    
    return json.dumps(compile())
