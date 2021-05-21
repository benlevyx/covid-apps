import styled from 'styled-components';


const StyledDiv = styled.div`
  margin: 1em;
`;

const StyledIframe = styled.iframe`
  background: transparent;
  border: 1px solid #ccc
`

const Table = () => {
  return (
    <StyledDiv>
      <StyledIframe
        className="airtable-embed"
        src="https://airtable.com/embed/shrjd2Usi6513G5Q3?backgroundColor=yellow&viewControls=on"
        frameborder="0"
        onmousewheel=""
        width="100%"
        height="600px"
      />
    </StyledDiv>
  )
};

export default Table;