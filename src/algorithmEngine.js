const clone = (values) => [...values]

function buildEvent(values, message, options = {}) {
  return {
    values: clone(values),
    message,
    type: options.type || 'ready',
    operation: options.operation || 'Inspect',
    comparison: options.comparison || '',
    decision: options.decision || '',
    state: {
      target: options.target ?? null,
      ...options.state,
    },
  }
}

function appendStep(events, values, message, options = {}) {
  events.push(buildEvent(values, message, options))
}

export function createExecution(input, algorithm, target = null) {
  const values = Array.isArray(input) ? clone(input) : []
  const events = []

  if (!values.length) {
    appendStep(events, values, 'No values to process.', {
      type: 'ready',
      operation: 'Empty',
      target,
      state: { target },
    })
    return events
  }

  if (algorithm === 'Bubble sort') {
    const array = clone(values)
    appendStep(events, array, 'Start bubble sort.', {
      type: 'ready',
      operation: 'Initialize',
      target,
      state: { target },
    })

    for (let end = array.length - 1; end > 0; end -= 1) {
      for (let index = 0; index < end; index += 1) {
        const left = array[index]
        const right = array[index + 1]
        appendStep(events, array, `Compare ${left} and ${right}.`, {
          type: 'compare',
          operation: 'Compare',
          comparison: `${left} > ${right}`,
          target,
          state: { index, nextIndex: index + 1, left, right },
        })

        if (left > right) {
          ;[array[index], array[index + 1]] = [array[index + 1], array[index]]
          appendStep(events, array, `Swap ${left} and ${right}.`, {
            type: 'swap',
            operation: 'Swap',
            comparison: `${left} and ${right} swapped`,
            target,
            state: { index, nextIndex: index + 1, left, right },
          })
        }
      }
    }

    appendStep(events, array, 'Bubble sort complete.', {
      type: 'done',
      operation: 'Complete',
      decision: 'The collection is fully sorted.',
      target,
      state: { target, sorted: clone(array) },
    })
    return events
  }

  if (algorithm === 'Selection sort') {
    const array = clone(values)
    appendStep(events, array, 'Start selection sort.', {
      type: 'ready',
      operation: 'Initialize',
      target,
      state: { target },
    })

    for (let start = 0; start < array.length - 1; start += 1) {
      let minIndex = start
      appendStep(events, array, `Scan the remaining range for the minimum value.`, {
        type: 'scan',
        operation: 'Find minimum',
        target,
        state: { start, minIndex },
      })

      for (let index = start + 1; index < array.length; index += 1) {
        appendStep(events, array, `Check ${array[index]} against ${array[minIndex]}.`, {
          type: 'compare',
          operation: 'Compare',
          comparison: `${array[index]} < ${array[minIndex]}`,
          target,
          state: { index, minIndex, candidate: array[index], currentMin: array[minIndex] },
        })

        if (array[index] < array[minIndex]) {
          minIndex = index
          appendStep(events, array, `Update the minimum pointer to index ${minIndex}.`, {
            type: 'update',
            operation: 'Track minimum',
            target,
            state: { minIndex },
          })
        }
      }

      if (minIndex !== start) {
        ;[array[start], array[minIndex]] = [array[minIndex], array[start]]
        appendStep(events, array, `Place ${array[start]} into its correct position.`, {
          type: 'swap',
          operation: 'Swap',
          target,
          state: { start, minIndex },
        })
      }
    }

    appendStep(events, array, 'Selection sort complete.', {
      type: 'done',
      operation: 'Complete',
      decision: 'Each position holds the correct smallest remaining value.',
      target,
      state: { target, sorted: clone(array) },
    })
    return events
  }

  if (algorithm === 'Insertion sort') {
    const array = clone(values)
    appendStep(events, array, 'Start insertion sort.', {
      type: 'ready',
      operation: 'Initialize',
      target,
      state: { target },
    })

    for (let index = 1; index < array.length; index += 1) {
      const current = array[index]
      let cursor = index - 1

      appendStep(events, array, `Insert ${current} into the sorted prefix.`, {
        type: 'shift',
        operation: 'Insert',
        target,
        state: { index, current, cursor },
      })

      while (cursor >= 0 && array[cursor] > current) {
        array[cursor + 1] = array[cursor]
        appendStep(events, array, `Shift ${array[cursor]} right.`, {
          type: 'compare',
          operation: 'Shift',
          comparison: `${array[cursor]} > ${current}`,
          target,
          state: { cursor, current },
        })
        cursor -= 1
      }

      array[cursor + 1] = current
      appendStep(events, array, `Place ${current} in the correct position.`, {
        type: 'update',
        operation: 'Insert',
        target,
        state: { index, current, cursor: cursor + 1 },
      })
    }

    appendStep(events, array, 'Insertion sort complete.', {
      type: 'done',
      operation: 'Complete',
      decision: 'The sorted prefix continues to expand until the whole array is ordered.',
      target,
      state: { target, sorted: clone(array) },
    })
    return events
  }

  if (algorithm === 'Merge sort') {
    const array = clone(values)
    const temp = new Array(array.length)
    const merge = (left, right) => {
      let index = left
      let leftIndex = left
      let rightIndex = right

      while (leftIndex < right && rightIndex < right + (array.length - right)) {
        const leftValue = array[leftIndex]
        const rightValue = array[rightIndex]
        appendStep(events, array, `Compare ${leftValue} and ${rightValue} in the merge window.`, {
          type: 'compare',
          operation: 'Merge',
          comparison: `${leftValue} <= ${rightValue}`,
          target,
          state: { leftIndex, rightIndex, left, right },
        })

        if (leftValue <= rightValue) {
          temp[index++] = leftValue
          leftIndex += 1
        } else {
          temp[index++] = rightValue
          rightIndex += 1
        }
      }

      while (leftIndex < right) {
        temp[index++] = array[leftIndex++]
      }

      while (rightIndex < array.length) {
        temp[index++] = array[rightIndex++]
      }

      for (let i = left; i < array.length; i += 1) {
        array[i] = temp[i]
      }

      appendStep(events, array, 'Merge sorted segments back together.', {
        type: 'merge',
        operation: 'Merge',
        target,
        state: { left, right },
      })
    }

    const sortRange = (start, end) => {
      if (end - start <= 1) return
      const middle = Math.floor((start + end) / 2)
      sortRange(start, middle)
      sortRange(middle, end)
      merge(start, middle)
    }

    appendStep(events, array, 'Split the list and sort each half recursively.', {
      type: 'ready',
      operation: 'Initialize',
      target,
      state: { target },
    })
    sortRange(0, array.length)

    appendStep(events, array, 'Merge sort complete.', {
      type: 'done',
      operation: 'Complete',
      decision: 'All halves have been merged into a fully sorted list.',
      target,
      state: { target, sorted: clone(array) },
    })
    return events
  }

  if (algorithm === 'Quick sort') {
    const array = clone(values)
    const partition = (left, right) => {
      const pivot = array[right]
      let storeIndex = left
      appendStep(events, array, `Choose pivot ${pivot} from the right edge.`, {
        type: 'pivot',
        operation: 'Partition',
        target,
        state: { left, right, pivot },
      })

      for (let index = left; index < right; index += 1) {
        appendStep(events, array, `Compare ${array[index]} with pivot ${pivot}.`, {
          type: 'compare',
          operation: 'Partition',
          comparison: `${array[index]} <= ${pivot}`,
          target,
          state: { index, pivot, left, right },
        })

        if (array[index] <= pivot) {
          ;[array[storeIndex], array[index]] = [array[index], array[storeIndex]]
          appendStep(events, array, `Move ${array[storeIndex]} before the pivot.`, {
            type: 'swap',
            operation: 'Partition',
            target,
            state: { storeIndex, index, pivot },
          })
          storeIndex += 1
        }
      }

      ;[array[storeIndex], array[right]] = [array[right], array[storeIndex]]
      appendStep(events, array, `Place the pivot at index ${storeIndex}.`, {
        type: 'swap',
        operation: 'Pivot',
        target,
        state: { storeIndex, pivot },
      })
      return storeIndex
    }

    const recurse = (left, right) => {
      if (left >= right) return
      const pivotIndex = partition(left, right)
      recurse(left, pivotIndex - 1)
      recurse(pivotIndex + 1, right)
    }

    appendStep(events, array, 'Start quick sort.', {
      type: 'ready',
      operation: 'Initialize',
      target,
      state: { target },
    })
    recurse(0, array.length - 1)

    appendStep(events, array, 'Quick sort complete.', {
      type: 'done',
      operation: 'Complete',
      decision: 'The pivot strategy has partitioned and sorted both sides.',
      target,
      state: { target, sorted: clone(array) },
    })
    return events
  }

  if (algorithm === 'Heap sort') {
    const array = clone(values)
    const heapify = (length, root) => {
      let largest = root
      const left = root * 2 + 1
      const right = root * 2 + 2

      if (left < length && array[left] > array[largest]) {
        largest = left
      }
      if (right < length && array[right] > array[largest]) {
        largest = right
      }

      if (largest !== root) {
        ;[array[root], array[largest]] = [array[largest], array[root]]
        appendStep(events, array, `Heapify by swapping ${array[root]} and ${array[largest]}.`, {
          type: 'swap',
          operation: 'Heapify',
          target,
          state: { root, largest },
        })
        heapify(length, largest)
      }
    }

    appendStep(events, array, 'Build a max heap from the input.', {
      type: 'ready',
      operation: 'Initialize',
      target,
      state: { target },
    })

    for (let index = Math.floor(array.length / 2) - 1; index >= 0; index -= 1) {
      heapify(array.length, index)
    }

    for (let end = array.length - 1; end > 0; end -= 1) {
      ;[array[0], array[end]] = [array[end], array[0]]
      appendStep(events, array, `Move the largest value to the end of the array.`, {
        type: 'swap',
        operation: 'Extract max',
        target,
        state: { end },
      })
      heapify(end, 0)
    }

    appendStep(events, array, 'Heap sort complete.', {
      type: 'done',
      operation: 'Complete',
      decision: 'The heap property has been used to place values in sorted order.',
      target,
      state: { target, sorted: clone(array) },
    })
    return events
  }

  if (algorithm === 'Counting sort') {
    const array = clone(values)
    const max = Math.max(...array)
    const counts = new Array(max + 1).fill(0)
    appendStep(events, array, 'Count how often each value appears.', {
      type: 'count',
      operation: 'Count',
      target,
      state: { target, max },
    })

    for (const value of array) {
      counts[value] += 1
    }

    let writeIndex = 0
    for (let value = 0; value <= max; value += 1) {
      while (counts[value] > 0) {
        array[writeIndex] = value
        counts[value] -= 1
        writeIndex += 1
      }
    }

    appendStep(events, array, 'Counting sort complete.', {
      type: 'done',
      operation: 'Complete',
      decision: 'The counts have been replayed into sorted order.',
      target,
      state: { target, sorted: clone(array) },
    })
    return events
  }

  if (algorithm === 'Binary search') {
    const array = clone(values).sort((left, right) => left - right)
    const targetValue = Number(target)
    let left = 0
    let rightIndex = array.length - 1
    let foundIndex = -1

    appendStep(events, array, 'Binary search starts on sorted values.', {
      type: 'ready',
      operation: 'Initialize',
      target: targetValue,
      state: { target: targetValue, left, right: rightIndex },
    })

    while (left <= rightIndex) {
      const middle = Math.floor((left + rightIndex) / 2)
      const middleValue = array[middle]
      appendStep(events, array, `Check the middle value ${middleValue}.`, {
        type: 'compare',
        operation: 'Search',
        comparison: `${middleValue} compared against ${targetValue}`,
        target: targetValue,
        state: { left, right: rightIndex, middle, middleValue, target: targetValue },
      })

      if (middleValue === targetValue) {
        foundIndex = middle
        appendStep(events, array, `Found ${targetValue} at index ${middle}.`, {
          type: 'done',
          operation: 'Match',
          decision: `Target found at index ${middle}.`,
          target: targetValue,
          state: { left, right: rightIndex, foundIndex: middle, target: targetValue },
        })
        return events
      }

      if (middleValue < targetValue) {
        left = middle + 1
      } else {
        rightIndex = middle - 1
      }
    }

    appendStep(events, array, `${targetValue} was not found in the array.`, {
      type: 'done',
      operation: 'No match',
      decision: 'The target falls outside the remaining search range.',
      target: targetValue,
      state: { target: targetValue, foundIndex, left, right: rightIndex },
    })
    return events
  }

  if (algorithm === 'Linear search') {
    const array = clone(values)
    const targetValue = Number(target)
    let foundIndex = -1

    appendStep(events, array, 'Linear search tests each index in order.', {
      type: 'ready',
      operation: 'Initialize',
      target: targetValue,
      state: { target: targetValue },
    })

    for (let index = 0; index < array.length; index += 1) {
      appendStep(events, array, `Compare ${array[index]} with ${targetValue}.`, {
        type: 'compare',
        operation: 'Search',
        comparison: `${array[index]} === ${targetValue}`,
        target: targetValue,
        state: { index, value: array[index], target: targetValue },
      })

      if (array[index] === targetValue) {
        foundIndex = index
        appendStep(events, array, `Found ${targetValue} at index ${index}.`, {
          type: 'done',
          operation: 'Match',
          decision: `Target found at index ${index}.`,
          target: targetValue,
          state: { foundIndex: index, target: targetValue },
        })
        return events
      }
    }

    appendStep(events, array, `${targetValue} was not found in the array.`, {
      type: 'done',
      operation: 'No match',
      decision: 'Every position has been checked.',
      target: targetValue,
      state: { target: targetValue, foundIndex },
    })
    return events
  }

  if (algorithm === 'Jump search') {
    const array = clone(values).sort((left, right) => left - right)
    const targetValue = Number(target)
    const step = Math.floor(Math.sqrt(array.length))
    let left = 0
    let rightIndex = Math.min(step, array.length) - 1

    appendStep(events, array, 'Jump search steps through sorted blocks.', {
      type: 'ready',
      operation: 'Initialize',
      target: targetValue,
      state: { target: targetValue, step },
    })

    while (left < array.length && array[rightIndex] < targetValue) {
      appendStep(events, array, `Jump ahead to the next block starting at index ${rightIndex}.`, {
        type: 'compare',
        operation: 'Jump',
        comparison: `${array[rightIndex]} < ${targetValue}`,
        target: targetValue,
        state: { left, right: rightIndex, step },
      })
      left = rightIndex
      rightIndex = Math.min(rightIndex + step, array.length - 1)
    }

    for (let index = left; index <= rightIndex && index < array.length; index += 1) {
      appendStep(events, array, `Linear scan through the final block at index ${index}.`, {
        type: 'compare',
        operation: 'Scan',
        comparison: `${array[index]} === ${targetValue}`,
        target: targetValue,
        state: { index, value: array[index], target: targetValue },
      })

      if (array[index] === targetValue) {
        appendStep(events, array, `Found ${targetValue} at index ${index}.`, {
          type: 'done',
          operation: 'Match',
          decision: `Target found at index ${index}.`,
          target: targetValue,
          state: { foundIndex: index, target: targetValue },
        })
        return events
      }
    }

    appendStep(events, array, `${targetValue} was not found using jump search.`, {
      type: 'done',
      operation: 'No match',
      decision: 'The remaining block was scanned and the target is absent.',
      target: targetValue,
      state: { target: targetValue, left, right: rightIndex },
    })
    return events
  }

  if (algorithm === 'Interpolation search') {
    const array = clone(values).sort((left, right) => left - right)
    const targetValue = Number(target)
    let low = 0
    let high = array.length - 1

    appendStep(events, array, 'Interpolation search estimates a likely index for the target.', {
      type: 'ready',
      operation: 'Initialize',
      target: targetValue,
      state: { target: targetValue, low, high },
    })

    while (low <= high && array[low] <= targetValue && array[high] >= targetValue) {
      const range = array[high] - array[low]
      const position = range === 0 ? low : low + Math.floor(((targetValue - array[low]) / range) * (high - low))
      const valueAtPosition = array[position]
      appendStep(events, array, `Estimate position ${position} and inspect ${valueAtPosition}.`, {
        type: 'compare',
        operation: 'Estimate',
        comparison: `${valueAtPosition} compared against ${targetValue}`,
        target: targetValue,
        state: { low, high, position, valueAtPosition },
      })

      if (valueAtPosition === targetValue) {
        appendStep(events, array, `Found ${targetValue} at index ${position}.`, {
          type: 'done',
          operation: 'Match',
          decision: `Target found at index ${position}.`,
          target: targetValue,
          state: { foundIndex: position, target: targetValue },
        })
        return events
      }

      if (valueAtPosition < targetValue) {
        low = position + 1
      } else {
        high = position - 1
      }
    }

    appendStep(events, array, `${targetValue} was not found with interpolation search.`, {
      type: 'done',
      operation: 'No match',
      decision: 'The estimated window was exhausted without a match.',
      target: targetValue,
      state: { target: targetValue, low, high },
    })
    return events
  }

  if (algorithm === 'Exponential search') {
    const array = clone(values).sort((left, right) => left - right)
    const targetValue = Number(target)
    let bound = 1

    appendStep(events, array, 'Exponential search doubles its search range until the target is in range.', {
      type: 'ready',
      operation: 'Initialize',
      target: targetValue,
      state: { target: targetValue, bound },
    })

    if (array[0] === targetValue) {
      appendStep(events, array, `Found ${targetValue} at the first index.`, {
        type: 'done',
        operation: 'Match',
        decision: `Target found at index 0.`,
        target: targetValue,
        state: { foundIndex: 0, target: targetValue },
      })
      return events
    }

    while (bound < array.length && array[bound] < targetValue) {
      appendStep(events, array, `Expand the search range to ${bound * 2}.`, {
        type: 'compare',
        operation: 'Expand',
        comparison: `${array[bound]} < ${targetValue}`,
        target: targetValue,
        state: { bound, candidate: array[bound], target: targetValue },
      })
      bound *= 2
    }

    let left = Math.floor(bound / 2)
    let right = Math.min(bound, array.length - 1)
    while (left <= right) {
      const middle = Math.floor((left + right) / 2)
      appendStep(events, array, `Binary search inside the exponential range at index ${middle}.`, {
        type: 'compare',
        operation: 'Binary search',
        comparison: `${array[middle]} compared against ${targetValue}`,
        target: targetValue,
        state: { left, right, middle, target: targetValue },
      })

      if (array[middle] === targetValue) {
        appendStep(events, array, `Found ${targetValue} at index ${middle}.`, {
          type: 'done',
          operation: 'Match',
          decision: `Target found at index ${middle}.`,
          target: targetValue,
          state: { foundIndex: middle, target: targetValue },
        })
        return events
      }

      if (array[middle] < targetValue) {
        left = middle + 1
      } else {
        right = middle - 1
      }
    }

    appendStep(events, array, `${targetValue} was not found using exponential search.`, {
      type: 'done',
      operation: 'No match',
      decision: 'The value is absent from the final bounded range.',
      target: targetValue,
      state: { target: targetValue, left, right },
    })
    return events
  }

  appendStep(events, values, `No execution exists for ${algorithm}.`, {
    type: 'ready',
    operation: 'Unsupported',
    target,
    state: { target },
  })
  return events
}
