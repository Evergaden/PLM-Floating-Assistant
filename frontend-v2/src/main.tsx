import { mount } from './host'
import './theme/tokens.css'
import './styles.css'

const root = document.getElementById('root')
if (root) mount(root)
