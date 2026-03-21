import { ProtocolInput } from '@/components/ProtocolInput'

export default function InputPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Input</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
          Claude에서 받은 프로토콜 텍스트를 붙여넣고 저장하세요.
        </p>
      </div>
      <ProtocolInput />
    </div>
  )
}
