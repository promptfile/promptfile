def getInterstitialPrompt():
    def getTestData():
        return {}
    
    def compile(opt = { "args": {} }):
        foo = opt["args"]["foo"]
        GLASSVAR = {
            0: """{}""".format("""<Prompt>
{}
</Prompt>""".format("""{}""".format(foo)))
    }
        return {
            "fileName": "interstitial",
            "model": "text-davinci-003",
            "state": {},
            "originalDoc": "ignore me\n<Prompt>\n${foo}\n</Prompt>\nand me",
            "interpolatedDoc": """ignore me
{}
and me""".format(GLASSVAR[0]),
        }
    
    return json.dumps(compile())
