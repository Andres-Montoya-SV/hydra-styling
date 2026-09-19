import {Component, type ErrorInfo, type ReactNode} from 'react';
import {Button} from './button';

/** Contains render/lazy-import failures. Async handlers still need their own catch. */
export class ErrorBoundary extends Component<{
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  componentDidCatch(error: Error, info: ErrorInfo) { this.props.onError?.(error, info); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <section role="alert" className="m-6 grid gap-4 rounded-hydra border border-hydra-line bg-hydra-surface p-6">
      <h1 className="font-display text-2xl">This view could not load</h1>
      <p>Try again, or reload to retrieve the latest application. Unsaved changes may be lost when reloading.</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => this.setState({failed: false})}>Try again</Button>
        <Button variant="secondary" onClick={() => window.location.reload()}>Reload application</Button>
      </div>
    </section>;
  }
}
