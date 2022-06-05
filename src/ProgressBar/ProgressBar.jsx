import './ProgressBar.css'
import { motion } from 'framer-motion'

function ProgressBar(props) {
    return(
        <motion.div animate={{ scaleY: props.updating ? 1 : 0}}>
            <div className='box progressContainer'>
                <progress className="progress is-info" value={props.completion} max="100"></progress>
                <div className='labelTxt'>File {props.fileCount} of 4</div>
            </div>
        </motion.div>
    )
}

export default ProgressBar;