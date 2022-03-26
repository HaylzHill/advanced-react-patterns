// Control Props
// http://localhost:3000/isolated/exercise/06.js

import * as React from 'react'
import warning from 'warning'
import {Switch} from '../switch'

const callAll =
  (...fns) =>
  (...args) =>
    fns.forEach(fn => fn?.(...args))

const actionTypes = {
  toggle: 'toggle',
  reset: 'reset',
}

function toggleReducer(state, {type, initialState}) {
  switch (type) {
    case actionTypes.toggle: {
      return {on: !state.on}
    }
    case actionTypes.reset: {
      return initialState
    }
    default: {
      throw new Error(`Unsupported type: ${type}`)
    }
  }
}
function useOnChangeReadOnlyWarning({
  controlPropName,
  controlPropDefaultName,
  controlHandlerName,
  controlPropValue,
  changeHandler,
  readOnly,
}) {
  const isControlled = controlPropValue != null
  const hasChangeHandler = !!changeHandler

  React.useEffect(() => {
    warning(
      !(isControlled && !hasChangeHandler && !readOnly),
      `Failed prop type: You provided a ${controlPropName} prop to a toggle without an ${controlHandlerName} handler. This will render a read-only field. If the field should be mutable use ${controlPropDefaultName}. Otherwise, set either ${controlHandlerName} or readOnly.`,
    )
  }, [
    controlHandlerName,
    controlPropDefaultName,
    controlPropName,
    hasChangeHandler,
    isControlled,
    readOnly,
  ])
}

function useControlledToggleWarning({controlPropValue}) {
  const isControlled = controlPropValue != null
  const {current: WasControlled} = React.useRef(isControlled)

  React.useEffect(() => {
    warning(
      !(isControlled && !WasControlled),
      'A component is changing an uncontrolled input to be controlled. This is likely caused by the value changing from undefined to a defined value, which should not happen. Decide between using a controlled or uncontrolled input element for the lifetime of the component.',
    )
    warning(
      !(!isControlled && WasControlled),
      'A component is changing a controlled input to be uncontrolled. This is likely caused by the value changing from a defined to undefined, which should not happen. Decide between using a controlled or uncontrolled input element for the lifetime of the component.',
    )
  }, [isControlled, WasControlled])
}

function useToggle({
  initialOn = false,
  reducer = toggleReducer,
  onChange,
  on: controlledOn,
  readOnly = false,
} = {}) {
  const {current: initialState} = React.useRef({on: initialOn})
  const [state, dispatch] = React.useReducer(reducer, initialState)

  const onIsControlled = controlledOn != null
  const on = onIsControlled ? controlledOn : state.on
  console.log(onIsControlled)

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useControlledToggleWarning({
      controlledOn,
    })
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useOnChangeReadOnlyWarning({
      controlPropName: 'on',
      controlPropDefaultName: 'initialOn',
      controlHandlerName: 'onChange',
      controlPropValue: controlledOn,
      changeHandler: onChange,
      readOnly,
    })
  }

  const dispatchWithOnChange = action => {
    if (!onIsControlled) dispatch(action)
    onChange?.(reducer({...state, on}, action), action)
  }

  const toggle = () => dispatchWithOnChange({type: actionTypes.toggle})
  const reset = () =>
    dispatchWithOnChange({type: actionTypes.reset, initialState})

  function getTogglerProps({onClick, ...props} = {}) {
    return {
      'aria-pressed': on,
      onClick: callAll(onClick, toggle),
      ...props,
    }
  }

  function getResetterProps({onClick, ...props} = {}) {
    return {
      onClick: callAll(onClick, reset),
      ...props,
    }
  }

  return {
    on,
    reset,
    toggle,
    getTogglerProps,
    getResetterProps,
  }
}

function Toggle({on: controlledOn, onChange, readOnly}) {
  const {on, getTogglerProps} = useToggle({
    on: controlledOn,
    onChange,
    readOnly,
  })
  const props = getTogglerProps({on})
  return <Switch {...props} />
}

function App() {
  const [bothOn, setBothOn] = React.useState(false)
  const [timesClicked, setTimesClicked] = React.useState(0)

  function handleToggleChange(state, action) {
    if (action.type === actionTypes.toggle && timesClicked > 4) {
      return
    }
    setBothOn(state.on)
    setTimesClicked(c => c + 1)
  }

  function handleResetClick() {
    setBothOn(false)
    setTimesClicked(0)
  }

  return (
    <div>
      <div>
        <Toggle on={bothOn} onChange={handleToggleChange} />
        <Toggle on={bothOn} onChange={handleToggleChange} />
      </div>
      {timesClicked > 4 ? (
        <div data-testid="notice">
          Whoa, you clicked too much!
          <br />
        </div>
      ) : (
        <div data-testid="click-count">Click count: {timesClicked}</div>
      )}
      <button onClick={handleResetClick}>Reset</button>
      <hr />
      <div>
        <div>Uncontrolled Toggle:</div>
        <Toggle
          onChange={(...args) =>
            console.info('Uncontrolled Toggle onChange', ...args)
          }
        />
      </div>
    </div>
  )
}

export default App
// we're adding the Toggle export for tests
export {Toggle}

/*
eslint
  no-unused-vars: "off",
*/
