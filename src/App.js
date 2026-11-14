import styled from '@emotion/styled';
import './App.css';
import TimelineDisplay from './components/TimelineDisplay';

function App() {
  return (
    <AppContainer className="App">
      <Header>
        <h1>Cosmere Interactive Timeline</h1>
      </Header>
      <Content>
        <TimelineDisplay />
      </Content>
      <Footer>
        Unofficial, non-commercial fan project. Cosmere is the property of Brandon Sanderson.
      </Footer>
    </AppContainer>
  );
}

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #101617;
  color: #f7f2e7;
  width: 100%;
  padding: 0 0 4rem;
`;

const Header = styled.header`
  width: 100%;
  min-height: 4rem;
  background-color: #182021;
  border-bottom: 1px solid #445051;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;

  h1 {
    margin: 0;
    text-align: center;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: clamp(1.4rem, 4vw, 2rem);
    font-weight: 500;
    letter-spacing: 0.02em;
  }
`;

const Content = styled.main`
  width: 100%;
  padding: 1.25rem clamp(0.75rem, 3vw, 2.5rem);
`;

const Footer = styled.footer`
  width: 100%;
  margin-top: 2rem;
  color: #8f9a98;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
`;

export default App;
