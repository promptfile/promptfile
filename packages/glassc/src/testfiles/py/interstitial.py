def getInterstitialPrompt(interpolationArgs = {}):
    def get_test_data(): return {}
    
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
            "interpolationArgs": opt["args"],
            "interpolatedDoc": """
foo = "bar"
{}
print(foo)""".format(GLASSVAR[0]),
        }
    
    testData = get_test_data()
    args = { "args": testData }
    args.update(interpolationArgs)
    return json.dumps(compile(args))
