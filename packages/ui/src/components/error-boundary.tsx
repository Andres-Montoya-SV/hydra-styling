import {Component, type ContextType, type ErrorInfo, type ReactNode} from 'react';
import {Button} from './button';
import {LocaleContext} from './locale';

/** Contains render/lazy-import failures. Async handlers still need their own catch. */
export class ErrorBoundary extends Component<{
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}, {failed: boolean}> {
  state = {failed: false};
  static contextType = LocaleContext;
  declare context: ContextType<typeof LocaleContext>;
  static getDerivedStateFromError() { return {failed: true}; }
  componentDidCatch(error: Error, info: ErrorInfo) { this.props.onError?.(error, info); }
  render() {
    if (!this.state.failed) return this.props.children;
    const {messages} = this.context;
    return <section role="alert" className="m-6 grid gap-4 rounded-hydra border border-hydra-line bg-hydra-surface p-6">
      <h1 className="font-display text-2xl">{messages.viewError}</h1>
      <p>{messages.viewErrorHint}</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => this.setState({failed: false})}>{messages.retry}</Button>
        <Button variant="secondary" onClick={() => window.location.reload()}>{messages.reload}</Button>
      </div>
    </section>;
  }
}
