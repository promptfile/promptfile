def getLiteralPrompt(interpolationArgs = {}):
    def get_test_data(): return {}
    
    def compile(opt = { "args": {} }):
        import requests
        
        response = requests.get("https://elliottburris.com")
        GLASSVAR = {
            0: """{}""".format("""<System>
{}
</System>""".format("""your job is to answer questions based on the following website code:
###
{}
###""".format(response.text))),
            1: """{}""".format("""<User>
{}
</User>""".format("""where did elliott go to school?""".format())),
            2: """{}""".format("""<Request model="gpt-3.5-turbo">
{}
</Request>""".format("""""".format()))
    }
        return {
            "fileName": "literal",
            "requestBlocks": [ { "model": "gpt-3.5-turbo", "onResponse": None } ],
            "state": {},
            "originalDoc": "---\nlanguage: python\n---\n\nimport requests\n\nresponse = requests.get(\"https://elliottburris.com\")\n\n<System>\nyour job is to answer questions based on the following website code:\n###\n${response.text}\n###\n</System>\n\n<User>\nwhere did elliott go to school?\n</User>\n\n<Request model=\"gpt-3.5-turbo\" />",
            "interpolationArgs": opt["args"],
            "interpolatedDoc": """
import requests

response = requests.get("https://elliottburris.com")

{}

{}

{}""".format(GLASSVAR[0], GLASSVAR[1], GLASSVAR[2]),
        }
    
    testData = get_test_data()
    testData.update(interpolationArgs)
    return json.dumps(compile({ "args": testData }))
