
class App extends React.Component {
  render() {
    return (
      <React.Fragment>
        <Header />
        <div id="container" className="container">
          <BubbleCloud />
        </div>
      </React.Fragment>
    );
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);