interface MessageLogProps {
  messages: string[];
}

export default function MessageLog({ messages }: MessageLogProps) {
  const visible = messages.slice(-6).reverse();

  return (
    <div className="message-log" data-testid="message-log">
      <h3>Log de partida</h3>
      <ul>
        {visible.map((message, index) => (
          <li key={`${visible.length - index}-${message}`}>{message}</li>
        ))}
      </ul>
    </div>
  );
}