'use client'

export default function CurriculumTree({ treeData }) {
  if (!treeData) return null

  const renderTree = (node) => {
    return (
      <ul className="ml-4 list-disc">
        {Object.entries(node).map(([key, value]) => (
          <li key={key}>
            {typeof value === 'object' ? (
              <>
                <span className="font-semibold">{key}</span>
                {renderTree(value)}
              </>
            ) : (
              <span>
                {key} ({value} หน่วยกิต)
              </span>
            )}
          </li>
        ))}
      </ul>
    )
  }

  return <div>{renderTree(treeData)}</div>
}
