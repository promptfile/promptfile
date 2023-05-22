import { expect } from 'chai'
import { getUseStatePairs, transformSetState, transformSetStateCalls } from './transformSetState'

describe.only('transformSetState', () => {
  describe('javascript/typescript', () => {
    it('should transform simple block', () => {
      const code = `const initProfile = { firstName: '', lastName: '', hasChatted: false };
const [profile, setProfile] = useState(initProfile);
const [moreState, setMoreState] = useState('');`
      const templateString = transformSetState(code)
      expect(templateString).to.equal(`const initProfile = { firstName: '', lastName: '', hasChatted: false };
const [profile, setProfile] = useState(initProfile, GLASS_STATE);
const [moreState, setMoreState] = useState('', GLASS_STATE);
`)
    })

    it('should get use state pairs', () => {
      const code = `const initProfile = { firstName: '', lastName: '', hasChatted: false };
const [profile, setProfile] = useState(initProfile);
const [moreState, setMoreState] = useState('');
const [foo, setBar] = useState('');`
      const pairs = getUseStatePairs(code)
      expect(pairs).to.deep.equal({ profile: 'setProfile', moreState: 'setMoreState', foo: 'setBar' })
    })

    it('should transform setState calls', () => {
      const code = `() => setBar('hello')`
      const transformedCode = transformSetStateCalls(code, { foo: 'setBar' })
      expect(transformedCode).to.equal(`() => GLASS_CONTEXT.setBar('hello');
`)
    })
  })
})
