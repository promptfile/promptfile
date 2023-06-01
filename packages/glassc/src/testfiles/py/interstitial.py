def getInterstitialPrompt(interpolationArgs = {}):
    def get_test_data(): return {}
    
    def compile(opt = { "args": {} }):
        foo = "bar"
        
        print(foo)
        GLASSVAR = {
            0: """{}""".format("""<User>
{}
</User>""".format("""{}""".format(foo)))
    }
        return {
            "fileName": "interstitial",
            "model": "gpt-3.5-turbo",
            "state": {},
            "originalDoc": "---\nlanguage: python\n---\n\nfoo = \"bar\"\n<User>\n${foo}\n</User>\nprint(foo)",
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
