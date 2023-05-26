import { expect } from 'chai'
import { transformPythonTestBlock } from './transformPyTestBlock'

describe('transformPyTestBlock', () => {
  it('should transform empty block', async () => {
    const res = await transformPythonTestBlock(``)
    expect(res).to.equal(`def get_test_data(): return {}`)
  })

  it('should transform simple block', async () => {
    const res = await transformPythonTestBlock(`a = 1
b = 2`)
    expect(res).to.equal(`def get_test_data():
    a = 1
    b = 2
    return {'a': a, 'b': b}`)
  })

  it('should transform simple block', async () => {
    const res = await transformPythonTestBlock(`a = 1
b = 2`)
    expect(res).to.equal(`def get_test_data():
    a = 1
    b = 2
    return {'a': a, 'b': b}`)
  })

  it('should transform block with multiline string', async () => {
    const res = await transformPythonTestBlock(`a = 1
b = """
{}
""".format("2")`)
    expect(res).to.equal(`def get_test_data():
    a = 1
    b = '\\n{}\\n'.format('2')
    return {'a': a, 'b': b}`)
  })

  it('sshould transform complex block', async () => {
    const res = await transformPythonTestBlock(`a = 1
b = 2
return [ {'foo': 'bar'} ]
`)
    expect(res).to.equal(`def get_test_data():
    a = 1
    b = 2
    _temp = [{'foo': 'bar'}]
    return [_item.update({'a': a, 'b': b}) or _item for _item in _temp]`)
  })
})
