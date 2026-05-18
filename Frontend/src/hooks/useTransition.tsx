import { useEffect, useRef, useState } from "react"

interface useTransitionProps {
    initValue: boolean
    transitionDelay: number
}

const useTransition = ({initValue, transitionDelay}: useTransitionProps) => {
    const [render, setRender] = useState<boolean>(initValue)

    // === [ proper cleanup purposes ] ===
    const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        return () => {
            if (timeoutId.current) clearTimeout(timeoutId.current)
        }
    }, [])

    // transition to another page with delay function
    const transitionTo = (transitionTo: string) => {

        // clear residual timeout if it exist for some reason
        if (timeoutId.current) clearTimeout(timeoutId.current)
 
        // set render to false
        setRender(false)

        // after specified delay, move to url specified
        timeoutId.current = setTimeout(() => {
            window.location.href = transitionTo
        }, transitionDelay)
 
    }

    // render after specified delay
    const transitionIn = () => {
        
        // clear residual timeout if it exist for some reason
        if (timeoutId.current) clearTimeout(timeoutId.current)

        timeoutId.current = setTimeout(() => {
            setRender(true)
        }, transitionDelay)
    
    }

    return {render, setRender, transitionIn, transitionTo}
}

export default useTransition