import './Unsupported.css'

import marblImg from './img/MARBL.png'
import axiboImg from './img/AXIBO.png'

function Unsupported() {
    return(
        <>
            <div className='errorContainer'>
                <img className='image' src={marblImg} alt='Marbl Logo'/>
                <div className='box'>This browser is not supported as it does not implement the web serial standard. To find more information about which browsers are supported, click the button below:</div>
                <a className='link' href='https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility' rel='noreferrer'>
                    <button className='button is-info'>Click here!</button>
                </a>
                <img className='image' src={axiboImg} alt='Powered by Axibo'/>
            </div>
        </>
    )
}

export default Unsupported