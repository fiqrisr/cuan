import { useChat } from '@ai-sdk/react';

function TestComponent() {
  const chat = useChat();
  console.log(Object.keys(chat));
}
