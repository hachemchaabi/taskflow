import { useEffect } from 'react'
import NProgress from 'accessible-nprogress'
import 'accessible-nprogress/dist/accessible-nprogress.css'

const LazyLoad: React.FC<{ showSpinner?: boolean }> = ({ showSpinner = false }) => {
  useEffect(() => {
    NProgress.configure({ showSpinner })
    NProgress.start()
    return () => {
      NProgress.done()
    }
  })

  return null
}

export default LazyLoad
