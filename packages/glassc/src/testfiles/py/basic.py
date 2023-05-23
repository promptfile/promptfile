def getBasicPrompt():
    def getTestData():
        return {}
    
    def compile(opt = { "args": {} }):
        
        GLASSVAR = {
            0: """{}""".format("""<Prompt>
{}
</Prompt>""".format("""foo""".format()))
    }
        return {
            "fileName": "basic",
            "model": "text-davinci-003",
            "state": {},
            "originalDoc": "<Prompt>\nfoo\n</Prompt>",
            "interpolatedDoc": """{}""".format(GLASSVAR[0]),
        }
    
    return json.dumps(compile())
