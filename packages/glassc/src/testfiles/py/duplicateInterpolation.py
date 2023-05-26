def getDuplicateInterpolationPrompt():
    def get_test_data(): return {}
    
    def compile(opt = { "args": {} }):
        foo = opt["args"]["foo"]
        bar = opt["args"]["bar"]
        GLASSVAR = {
            0: """{}""".format("""<Prompt>
{}
</Prompt>""".format("""{} {} {}
{}""".format(foo, bar, foo, bar)))
    }
        return {
            "fileName": "duplicateInterpolation",
            "model": "text-davinci-003",
            "state": {},
            "originalDoc": "<Prompt>\n${foo} ${bar} ${foo}\n${bar}\n</Prompt>",
            "interpolatedDoc": """{}""".format(GLASSVAR[0]),
        }
    
    testData = get_test_data()
    return json.dumps(compile({ "args": testData }))
