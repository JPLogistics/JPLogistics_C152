export const xmlConfig = `
<EngineDisplay>
  <EnginePage>
    <Gauge>
      <Type>Circular</Type>
      <ID>MANIN_Gauge</ID>
      <Title>MAN IN</Title>
      <Minimum>0</Minimum>
      <Maximum>40</Maximum>
      <Value>
        <Simvar name="RECIP ENG MANIFOLD PRESSURE:1" unit="inHG"/>
      </Value>
      <ColorZone>
        <Color>white</Color>
        <Begin>0</Begin>
        <End>40</End>
      </ColorZone>
      <ColorZone>
        <Color>green</Color>
        <Begin>15</Begin>
        <End>29.6</End>
      </ColorZone>
    </Gauge>

    <Gauge>
      <Type>Circular</Type>
      <ID>Piston_RPMGauge</ID>
      <Title></Title>
      <Unit>RPM</Unit>
      <Minimum>0</Minimum>
      <Maximum>3000</Maximum>
      <Style>
        <TextIncrement>10</TextIncrement>
      </Style>
      <Value>
        <Simvar name="PROP RPM:1" unit="rpm"/>
      </Value>
      <ColorZone>
        <Color>white</Color>
        <Begin>0</Begin>
        <End>3000</End>
      </ColorZone>
      <ColorZone>
        <Color>green</Color>
        <Begin>1800</Begin>
        <End>2700</End>
      </ColorZone>
      <ColorZone>
        <Color>red</Color>
        <Begin>2700</Begin>
        <End>3000</End>
      </ColorZone>
      <RedBlink>
        <Greater>
          <Simvar name="PROP RPM:1" unit="rpm"/>
          <Constant>2700</Constant>
        </Greater>
      </RedBlink>
    </Gauge>

    <Text>
      <Left>FFlow GPH</Left>
      <Right>
        <ToFixed precision="1">
          <Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
        </ToFixed>
      </Right>
    </Text>

    <Gauge>
      <Type>Horizontal</Type>
      <ID>Piston_FFlowGauge</ID>
      <Title></Title>
      <Unit></Unit>
      <Minimum>0</Minimum>
      <Maximum>30</Maximum>
      <Value>
        <Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
      </Value>
      <ColorZone>
        <Color>green</Color>
        <Begin>3</Begin>
        <End>27.4</End>
      </ColorZone>
      <ColorZone>
        <Color>red</Color>
        <Begin>27.4</Begin>
        <End>30</End>
      </ColorZone>
      <GraduationLength>2</GraduationLength>
      <GraduationTextLength>30</GraduationTextLength>
    </Gauge>

    <Gauge>
      <Type>Horizontal</Type>
      <ID>Piston_ChtGauge</ID>
      <Title>CHT</Title>
      <Unit></Unit>
      <Minimum>0</Minimum>
      <Maximum>250</Maximum>
      <Value>
        <Simvar name="ENG CYLINDER HEAD TEMPERATURE:1" unit="celsius"/>
      </Value>
      <GraduationLength></GraduationLength>
      <BeginText></BeginText>
      <EndText></EndText>
      <ColorZone>
        <Color>green</Color>
        <Begin>116</Begin>
        <End>238</End>
      </ColorZone>
      <ColorZone>
        <Color>red</Color>
        <Begin>238</Begin>
        <End>250</End>
      </ColorZone>
    </Gauge>

    <Gauge>
      <Type>Horizontal</Type>
      <ID>Piston_OilTempGauge</ID>
      <Title>Oil Temp</Title>
      <Unit></Unit>
      <Minimum>0</Minimum>
      <Maximum>120</Maximum>
      <Value>
        <Simvar name="GENERAL ENG OIL TEMPERATURE:1" unit="celsius"/>
      </Value>
      <ColorZone>
        <Color>yellow</Color>
        <Begin>0</Begin>
        <End>24</End>
      </ColorZone>
      <ColorZone>
        <Color>green</Color>
        <Begin>24</Begin>
        <End>116</End>
      </ColorZone>
      <ColorZone>
        <Color>red</Color>
        <Begin>116</Begin>
        <End>120</End>
      </ColorZone>
      <BeginText></BeginText>
      <EndText></EndText>
      <RedBlink>
        <Greater>
          <Simvar name="GENERAL ENG OIL TEMPERATURE:1" unit="celsius"/>
          <Constant>120</Constant>
        </Greater>
      </RedBlink>
    </Gauge>

    <Gauge>
      <Type>Horizontal</Type>
      <ID>Piston_OilPressGauge</ID>
      <Title>Oil Press</Title>
      <Unit></Unit>
      <Minimum>0</Minimum>
      <Maximum>105</Maximum>
      <Value>
        <Simvar name="GENERAL ENG OIL PRESSURE:1" unit="psi"/>
      </Value>
      <ColorZone>
        <Color>red</Color>
        <Begin>0</Begin>
        <End>10</End>
      </ColorZone>
      <ColorZone>
        <Color>yellow</Color>
        <Begin>10</Begin>
        <End>30</End>
      </ColorZone>
      <ColorZone>
        <Color>green</Color>
        <Begin>30</Begin>
        <End>60</End>
      </ColorZone>
      <ColorZone>
        <Color>red</Color>
        <Begin>100</Begin>
        <End>105</End>
      </ColorZone>
      <BeginText></BeginText>
      <EndText></EndText>
      <RedBlink>
        <Or>
          <Greater>
            <Simvar name="GENERAL ENG OIL PRESSURE:1" unit="psi"/>
            <Constant>100</Constant>
          </Greater>
          <Lower>
            <Simvar name="GENERAL ENG OIL PRESSURE:1" unit="psi"/>
            <Constant>10</Constant>
          </Lower>
        </Or>
      </RedBlink>
    </Gauge>

    <Gauge>
      <Type>DoubleHorizontal</Type>
      <ID>Piston_AltLoad</ID>
      <Title>Alt Load</Title>
      <Unit></Unit>
      <CursorText>1</CursorText>
      <CursorText2>2</CursorText2>
      <Minimum>0</Minimum>
      <Maximum>120</Maximum>
      <Value>
        <Simvar name="ELECTRICAL GENALT BUS AMPS:1" unit="amps"/>
      </Value>
      <Value2>
        <Simvar name="ELECTRICAL GENALT BUS AMPS:2" unit="amps"/>
      </Value2>
      <ColorZone>
        <Color>green</Color>
        <Begin>0</Begin>
        <End>100</End>
      </ColorZone>
      <ColorZone>
        <Color>yellow</Color>
        <Begin>100</Begin>
        <End>120</End>
      </ColorZone>
      <BeginText></BeginText>
      <EndText></EndText>
    </Gauge>

    <Gauge>
      <Type>DoubleHorizontal</Type>
      <ID>Piston_VoltsGauge</ID>
      <Title>Bus Volts</Title>
      <Unit></Unit>
      <CursorText>1</CursorText>
      <CursorText2>2</CursorText2>
      <Minimum>0</Minimum>
      <Maximum>33</Maximum>
      <Value>
        <Simvar name="ELECTRICAL MAIN BUS VOLTAGE:2" unit="volts"/>
      </Value>
      <Value2>
        <Simvar name="ELECTRICAL MAIN BUS VOLTAGE:3" unit="volts"/>
      </Value2>
      <ColorZone>
        <Color>yellow</Color>
        <Begin>10</Begin>
        <End>24</End>
      </ColorZone>
      <ColorZone>
        <Color>green</Color>
        <Begin>24</Begin>
        <End>30</End>
      </ColorZone>
      <ColorZone>
        <Color>yellow</Color>
        <Begin>30</Begin>
        <End>33</End>
      </ColorZone>
      <BeginText></BeginText>
      <EndText></EndText>
    </Gauge>

    <Gauge>
      <Type>DoubleHorizontal</Type>
      <ID>Piston_FuelGauge</ID>
      <Title>Fuel Qty</Title>
      <Unit>Gal</Unit>
      <CursorText>R</CursorText>
      <CursorText2>L</CursorText2>
      <Minimum>0</Minimum>
      <Maximum>37</Maximum>
      <Value>
        <Simvar name="FUEL RIGHT QUANTITY" unit="gallons"/>
      </Value>
      <Value2>
        <Simvar name="FUEL LEFT QUANTITY" unit="gallons"/>
      </Value2>
      <ColorZone>
        <Color>red</Color>
        <Begin>0</Begin>
        <End>3</End>
      </ColorZone>
      <ColorZone>
        <Color>yellow</Color>
        <Begin>3</Begin>
        <End>13</End>
      </ColorZone>
      <ColorZone>
        <Color>green</Color>
        <Begin>13</Begin>
        <End>37</End>
      </ColorZone>
      <GraduationLength text="True">10</GraduationLength>
      <EndText>F</EndText>
    </Gauge>
  </EnginePage>

  <LeanPage>
    <Gauge>
      <Type>Circular</Type>
      <ID>MANIN_Gauge</ID>
      <Title>MAN IN</Title>
      <Minimum>0</Minimum>
      <Maximum>40</Maximum>
      <Value>
        <Simvar name="RECIP ENG MANIFOLD PRESSURE:1" unit="inHG"/>
      </Value>
      <ColorZone>
        <Color>white</Color>
        <Begin>0</Begin>
        <End>40</End>
      </ColorZone>
      <ColorZone>
        <Color>green</Color>
        <Begin>15</Begin>
        <End>29.6</End>
      </ColorZone>
    </Gauge>

    <Gauge>
      <Type>Circular</Type>
      <ID>Piston_RPMGauge</ID>
      <Title></Title>
      <Unit>RPM</Unit>
      <Minimum>0</Minimum>
      <Maximum>3000</Maximum>
      <Style>
        <TextIncrement>10</TextIncrement>
      </Style>
      <Value>
        <Simvar name="PROP RPM:1" unit="rpm"/>
      </Value>
      <ColorZone>
        <Color>white</Color>
        <Begin>0</Begin>
        <End>3000</End>
      </ColorZone>
      <ColorZone>
        <Color>green</Color>
        <Begin>1800</Begin>
        <End>2700</End>
      </ColorZone>
      <ColorZone>
        <Color>red</Color>
        <Begin>2700</Begin>
        <End>3000</End>
      </ColorZone>
      <RedBlink>
        <Greater>
          <Simvar name="PROP RPM:1" unit="rpm"/>
          <Constant>2700</Constant>
        </Greater>
      </RedBlink>
    </Gauge>

    <Text>
      <Left>FFlow GPH</Left>
      <Right>
        <ToFixed precision="1">
          <Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
        </ToFixed>
      </Right>
    </Text>

    <Gauge>
      <Type>Cylinder</Type>
      <ID>EGT_Gauge</ID>
      <Title>EGT</Title>
      <Unit>°F</Unit>
      <Rows>13</Rows>
      <Columns>6</Columns>
      <Minimum>800</Minimum>
      <Maximum>1300</Maximum>
      <TempOrder>1,4,2,5,3,6</TempOrder>
      <Value>
        <Simvar name="GENERAL ENG EXHAUST GAS TEMPERATURE:1" unit="farenheit"/>
      </Value>
      <Style>
        <ShowPeak>True</ShowPeak>
        <TextIncrement>5</TextIncrement>
      </Style>
    </Gauge>

    <Gauge>
      <Type>Cylinder</Type>
      <ID>CHT_Gauge</ID>
      <Title>CHT</Title>
      <Unit>°F</Unit>
      <Rows>13</Rows>
      <Columns>6</Columns>
      <Minimum>200</Minimum>
      <Maximum>500</Maximum>
      <TempOrder>1,4,2,5,3,6</TempOrder>
      <Value>
        <Simvar name="ENG CYLINDER HEAD TEMPERATURE:1" unit="farenheit"/>
      </Value>
      <Style>
        <ShowRedline>True</ShowRedline>
        <TextIncrement>5</TextIncrement>
      </Style>
    </Gauge>
  </LeanPage>

  <SystemPage>
    <Gauge>
      <Type>Circular</Type>
      <ID>MANIN_Gauge</ID>
      <Title>MAN IN</Title>
      <Minimum>0</Minimum>
      <Maximum>40</Maximum>
      <Value>
        <Simvar name="RECIP ENG MANIFOLD PRESSURE:1" unit="inHG"/>
      </Value>
      <ColorZone>
        <Color>white</Color>
        <Begin>0</Begin>
        <End>40</End>
      </ColorZone>
      <ColorZone>
        <Color>green</Color>
        <Begin>15</Begin>
        <End>29.6</End>
      </ColorZone>
    </Gauge>

    <Gauge>
      <Type>Circular</Type>
      <ID>Piston_RPMGauge</ID>
      <Title></Title>
      <Unit>RPM</Unit>
      <Minimum>0</Minimum>
      <Maximum>3000</Maximum>
      <Style>
        <TextIncrement>10</TextIncrement>
      </Style>
      <Value>
        <Simvar name="PROP RPM:1" unit="rpm"/>
      </Value>
      <ColorZone>
        <Color>white</Color>
        <Begin>0</Begin>
        <End>3000</End>
      </ColorZone>
      <ColorZone>
        <Color>green</Color>
        <Begin>1800</Begin>
        <End>2700</End>
      </ColorZone>
      <ColorZone>
        <Color>red</Color>
        <Begin>2700</Begin>
        <End>3000</End>
      </ColorZone>
      <RedBlink>
        <Greater>
          <Simvar name="PROP RPM:1" unit="rpm"/>
          <Constant>2700</Constant>
        </Greater>
      </RedBlink>
    </Gauge>

    <Text>
      <Style>
        <Margins>
          <Top>10</Top>
        </Margins>
      </Style>
      <Left>----------</Left>
      <Center>System</Center>
      <Right>----------</Right>
    </Text>

    <Text>
      <Left>Oil °F</Left>
      <Right>
        <ToFixed precision="0">
          <Simvar name="GENERAL ENG OIL TEMPERATURE:1" unit="farenheit"/>
        </ToFixed>
      </Right>
    </Text>
    <Text>
      <Left>Oil PSI</Left>
      <Right>
        <ToFixed precision="1">
          <Simvar name="GENERAL ENG OIL PRESSURE:1" unit="psi"/>
        </ToFixed>
      </Right>
    </Text>

    <Text>
      <Style>
        <Margins>
          <Top>10</Top>
        </Margins>
      </Style>
      <Left>--------</Left>
      <Center>Fuel Calc</Center>
      <Right>--------</Right>
    </Text>

    <Text>
      <Left>FFlow GPH</Left>
      <Right>
        <ToFixed precision="1">
          <Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
        </ToFixed>
      </Right>
    </Text>

    <Text>
      <Left>Gal Rem</Left>
      <Right>
        <ToFixed precision="1">
          <Simvar name="L:WT1000_Fuel_GalRemaining" unit="gallon"/>
        </ToFixed>
      </Right>
    </Text>

    <Text>
      <Left>Gal Used</Left>
      <Right>
        <ToFixed precision="1">
          <Simvar name="L:WT1000_Fuel_GalBurned" unit="gallon"/>
        </ToFixed>
      </Right>
    </Text>

    <Text>
      <Left>Endur</Left>
      <Right>
        <If>
          <Condition>
            <Greater>
              <Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
              <Constant>0.1</Constant>
            </Greater>
          </Condition>
          <Then>
            <Add>
              <ToFixed precision="2">
                <Divide>
                  <Simvar name="L:WT1000_Fuel_GalRemaining" unit="gallon"/>
                  <Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
                </Divide>
              </ToFixed>
              <Constant>h</Constant>
            </Add>
          </Then>
          <Else>
            <Constant>X</Constant>
          </Else>
        </If>
      </Right>
    </Text>

    <Text>
      <Left>Range NM</Left>
      <Right>
        <If>
          <Condition>
            <Greater>
              <Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
              <Constant>0.1</Constant>
            </Greater>
          </Condition>
          <Then>
            <ToFixed precision="0">
              <Multiply>
                <Simvar name="GROUND VELOCITY:1" unit="knots"/>
                <Divide>
                  <Simvar name="L:WT1000_Fuel_GalRemaining" unit="gallon"/>
                  <Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
                </Divide>
              </Multiply>
            </ToFixed>
          </Then>
          <Else>
            <Constant>X</Constant>
          </Else>
        </If>
      </Right>
    </Text>

    <Text>
      <Style>
        <Margins>
          <Top>10</Top>
        </Margins>
      </Style>
      <Left>--------</Left>
      <Center>Electrical</Center>
      <Right>--------</Right>
    </Text>

    <Text>
      <Left>1</Left>
      <Center>Alt Load</Center>
      <Right>2</Right>
    </Text>

    <Text>
      <Left>
        <ToFixed precision="0">
          <Simvar name="ELECTRICAL GENALT BUS AMPS:1" unit="amps"/>
        </ToFixed>
      </Left>
      <Right>
        <ToFixed precision="0">
          <Simvar name="ELECTRICAL GENALT BUS AMPS:2" unit="amps"/>
        </ToFixed>
      </Right>
    </Text>

    <Text>
      <Left>1</Left>
      <Center>Bus Volts</Center>
      <Right>2</Right>
    </Text>

    <Text>
      <Left>
        <ToFixed precision="1">
          <Simvar name="ELECTRICAL MAIN BUS VOLTAGE:1" unit="volts"/>
        </ToFixed>
      </Left>
      <Right>
        <ToFixed precision="1">
          <Simvar name="ELECTRICAL MAIN BUS VOLTAGE:2" unit="volts"/>
        </ToFixed>
      </Right>
    </Text>
  </SystemPage>
</EngineDisplay>
`;