import requests

def getLiteralPrompt():
    def getTestData():
        return {}
    
    def compile(opt = { "args": {} }):
        response = requests.get("https://elliottburris.com")
        GLASSVAR = {
            0: """{}""".format("""<System>
{}
</System>""".format("""your job is to answer questions based on the following website code:
###
{}
###""".format("""{}""".format("""<Literal>
{}
</Literal>""".format("""{}""".format(response.text))))))
    }
        return {
            "fileName": "literal",
            "model": "gpt-3.5-turbo",
            "state": {},
            "originalDoc": "---\nlanguage: python\n---\n\nimport requests from \"requests\"\n\nresponse = requests.get(\"https://elliottburris.com\")\n\n<System>\nyour job is to answer questions based on the following website code:\n###\n<Literal>\n${response.text}\n</Literal>\n###\n</System>",
            "interpolatedDoc": """
import requests from "requests"

response = requests.get("https://elliottburris.com")

{}""".format(GLASSVAR[0]),
        }
    
    return json.dumps(compile())
