export default function ExpenseTable({ items, onDelete, onQuickEdit }) {
  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th>Title</th><th>Amount</th><th>Date</th><th>Category</th><th></th>
          </tr>
        </thead>
        <tbody>
          {items.map(e => (
            <tr key={e.id}>
              <td>{e.title}</td>
              <td>₹{e.amount}</td>
              <td>{e.date}</td>
              <td><span className="badge">{e.category}</span></td>
              <td style={{display:'flex', gap:8}}>
                <button onClick={() => onQuickEdit(e)}>Edit</button>
                <button onClick={() => onDelete(e.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
