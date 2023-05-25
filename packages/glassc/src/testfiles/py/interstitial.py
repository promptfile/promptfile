def getInterstitialPrompt():
    def getTestData():
        return {}
    
    def compile(opt = { "args": {} }):
        foo = "bar"
        
        
        print(foo)
        GLASSVAR = {
            0: """{}""".format("""<Prompt>
{}
</Prompt>""".format("""{}""".format(foo)))
    }
        return {
            "fileName": "interstitial",
            "model": "text-davinci-003",
            "state": {},
            "originalDoc": "---\nlanguage: python\n---\n\nfoo = \"bar\"\n<Prompt>\n${foo}\n</Prompt>\nprint(foo)",
            "interpolatedDoc": """
foo = "bar"
{}
print(foo)""".format(GLASSVAR[0]),
        }
    
    return json.dumps(compile())
