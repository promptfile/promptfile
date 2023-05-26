def getBasicPrompt():
    def get_test_data(): return {}
    
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
    
    testData = get_test_data()
    return json.dumps(compile({ "args": testData }))
