import { useFormAction, useNavigation } from 'react-router'

/**
 * React hook returns `true` if a react-router framework-powered form submission is pending.
 *
 * Default scope is `POST` to nearest route action; use `formAction` and `formMethod`
 * to scope this hook to a specific form submission.
 *
 * Handy for showing user feedback or disabling elements while a submission is pending.
 * Credit to @lukexlau who uses this hook in their react-router templates.
 */
export function useIsPending({
  formAction,
  formMethod = 'POST',
  state = 'non-idle',
}: {
  formAction?: string
  formMethod?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE'
  state?: 'submitting' | 'loading' | 'non-idle'
} = {}): boolean {
  const contextualFormAction = useFormAction()
  const navigation = useNavigation()
  const isPendingState = state === 'non-idle' ? navigation.state !== 'idle' : navigation.state === state

  return (
    isPendingState &&
    navigation.formAction === (formAction ?? contextualFormAction) &&
    navigation.formMethod === formMethod
  )
}
