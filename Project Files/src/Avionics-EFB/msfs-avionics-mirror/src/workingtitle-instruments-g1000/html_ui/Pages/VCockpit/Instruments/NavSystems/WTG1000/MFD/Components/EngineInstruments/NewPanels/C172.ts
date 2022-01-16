export const xmlConfig = `
<EngineDisplay override="true">
  <EnginePage>
    <Gauge>
      <Type>Circular</Type>
      <ID>Piston_RPMGauge</ID>
      <Style>
        <TextIncrement>10</TextIncrement>
        <ForceTextColor>white</ForceTextColor>
      </Style>
      <Title></Title>
      <Unit>RPM</Unit>
      <Minimum>0</Minimum>
      <Maximum>3000</Maximum>
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
        <Begin>2100</Begin>
        <End>
          <StateMachine>
            <State id="LowAlt" value="2500">
              <Transition to="MedAlt">
                <Greater>
                  <Simvar name="INDICATED ALTITUDE" unit="feet"/>
                  <Constant>5300</Constant>
                </Greater>
              </Transition>
            </State>
            <State id="MedAlt" value="2600">
              <Transition to="LowAlt">
                <Lower>
                  <Simvar name="INDICATED ALTITUDE" unit="feet"/>
                  <Constant>4700</Constant>
                </Lower>
              </Transition>
              <Transition to="HighAlt">
                <Greater>
                  <Simvar name="INDICATED ALTITUDE" unit="feet"/>
                  <Constant>10300</Constant>
                </Greater>
              </Transition>
            </State>
            <State id="HighAlt" value="2700">
              <Transition to="MedAlt">
                <Lower>
                  <Simvar name="INDICATED ALTITUDE" unit="feet"/>
                  <Constant>9700</Constant>
                </Lower>
              </Transition>
            </State>
          </StateMachine>
        </End>
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

    <Gauge>
      <Type>Horizontal</Type>
      <ID>Piston_FFlowGauge</ID>
      <Title>FFLOW</Title>
      <Unit>GPH</Unit>
      <Minimum>0</Minimum>
      <Maximum>20</Maximum>
      <Value>
        <Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
      </Value>
      <ColorZone>
        <Color>green</Color>
        <Begin>0</Begin>
        <End>12</End>
      </ColorZone>
      <GraduationLength>2</GraduationLength>
      <GraduationTextLength>20</GraduationTextLength>
    </Gauge>

    <Gauge>
      <Type>Horizontal</Type>
      <ID>Piston_OilPressGauge</ID>
      <Title>Oil PRES</Title>
      <Unit></Unit>
      <Minimum>0</Minimum>
      <Maximum>120</Maximum>
      <Value>
        <Simvar name="GENERAL ENG OIL PRESSURE:1" unit="psi"/>
      </Value>
      <ColorZone>
        <Color>red</Color>
        <Begin>0</Begin>
        <End>20</End>
      </ColorZone>
      <ColorZone>
        <Color>green</Color>
        <Begin>50</Begin>
        <End>90</End>
      </ColorZone>
      <ColorZone>
        <Color>red</Color>
        <Begin>115</Begin>
        <End>120</End>
      </ColorZone>
      <BeginText></BeginText>
      <EndText></EndText>
      <RedBlink>
        <Or>
          <Greater>
            <Simvar name="GENERAL ENG OIL PRESSURE:1" unit="psi"/>
            <Constant>115</Constant>
          </Greater>
          <Lower>
            <Simvar name="GENERAL ENG OIL PRESSURE:1" unit="psi"/>
            <Constant>20</Constant>
          </Lower>
        </Or>
      </RedBlink>
    </Gauge>

    <Gauge>
      <Type>Horizontal</Type>
      <ID>Piston_OilTempGauge</ID>
      <Title>Oil TEMP</Title>
      <Unit></Unit>
      <Minimum>75</Minimum>
      <Maximum>250</Maximum>
      <Value>
        <Simvar name="GENERAL ENG OIL TEMPERATURE:1" unit="farenheit"/>
      </Value>
      <ColorZone>
        <Color>green</Color>
        <Begin>100</Begin>
        <End>245</End>
      </ColorZone>
      <ColorZone>
        <Color>red</Color>
        <Begin>245</Begin>
        <End>250</End>
      </ColorZone>
      <BeginText></BeginText>
      <EndText></EndText>
      <RedBlink>
        <Greater>
          <Simvar name="GENERAL ENG OIL TEMPERATURE:1" unit="farenheit"/>
          <Constant>245</Constant>
        </Greater>
      </RedBlink>
    </Gauge>

    <Gauge>
      <Type>Horizontal</Type>
      <ID>Piston_EgtGauge</ID>
      <Title>EGT</Title>
      <Unit></Unit>
      <Minimum>1250</Minimum>
      <Maximum>1650</Maximum>
      <Value>
        <Simvar name="GENERAL ENG EXHAUST GAS TEMPERATURE:1" unit="farenheit"/>
      </Value>
      <GraduationLength>50</GraduationLength>
      <BeginText></BeginText>
      <EndText></EndText>
      <CursorText>1</CursorText>
    </Gauge>

    <Gauge>
      <Type>Horizontal</Type>
      <ID>Piston_VacGauge</ID>
      <Title>VAC</Title>
      <Unit></Unit>
      <Minimum>3</Minimum>
      <Maximum>7</Maximum>
      <Value>
        <Simvar name="SUCTION PRESSURE" unit="inch of mercury"/>
      </Value>
      <ColorZone>
        <Color>green</Color>
        <Begin>4.5</Begin>
        <End>5.5</End>
      </ColorZone>
      <BeginText></BeginText>
      <EndText></EndText>
    </Gauge>

    <Gauge>
      <Type>DoubleHorizontal</Type>
      <ID>Piston_FuelGauge</ID>
      <Title>FUEL QTY</Title>
      <Unit>GAL</Unit>
      <CursorText>R</CursorText>
      <CursorText2>L</CursorText2>
      <Minimum>0</Minimum>
      <Maximum>30</Maximum>
      <Value>
        <Simvar name="FUEL RIGHT QUANTITY" unit="gallons"/>
      </Value>
      <Value2>
        <Simvar name="FUEL LEFT QUANTITY" unit="gallons"/>
      </Value2>
      <ColorZone>
        <Color>red</Color>
        <Begin>0</Begin>
        <End>1.5</End>
      </ColorZone>
      <ColorZone>
        <Color>yellow</Color>
        <Begin>1.5</Begin>
        <End>5</End>
      </ColorZone>
      <ColorZone>
        <Color>green</Color>
        <Begin>5</Begin>
        <End>24</End>
      </ColorZone>
      <GraduationLength text="True">10</GraduationLength>
      <EndText>F</EndText>
    </Gauge>

    <Text>
      <Style>
        <Margins>
          <Top>20</Top>
          <Bottom>20</Bottom>
        </Margins>
      </Style>
      <Left>ENG HRS</Left>
      <Right id="Piston_EngineHours">
        <ToFixed precision="1">
          <Simvar name="GENERAL ENG ELAPSED TIME:1" unit="hour"/>
        </ToFixed>
      </Right>
    </Text>

    <Text>
      <Left>--------</Left>
      <Center>Electrical</Center>
      <Right>--------</Right>
    </Text>

    <Text>
      <Left>M</Left>
      <Center fontsize="8">Bus</Center>
      <Right>E</Right>
    </Text>

    <Text>
      <Left id="Piston_Bus_M">
        <ToFixed precision="1">
          <Simvar name="ELECTRICAL MAIN BUS VOLTAGE:3" unit="volts"/>
        </ToFixed>
      </Left>
      <Center fontsize="8">Volts</Center>
      <Right id="Piston_Bus_E">
        <ToFixed precision="1">
          <Simvar name="ELECTRICAL MAIN BUS VOLTAGE:6" unit="volts"/>
        </ToFixed>
      </Right>
    </Text>

    <Text>
      <Left>M</Left>
      <Center fontsize="8">Battery</Center>
      <Right>S</Right>
    </Text>

    <Text>
      <Left id="Piston_Batt_M">
        <ToFixed precision="0">
          <Substract>
            <Constant>0</Constant>
            <Simvar name="ELECTRICAL BATTERY LOAD:1" unit="amperes"/>
          </Substract>
        </ToFixed>
      </Left>
      <Center fontsize="8">Amps</Center>
      <Right id="Piston_Batt_S">
        <ToFixed precision="0">
          <Substract>
            <Constant>0</Constant>
            <Simvar name="ELECTRICAL BATTERY LOAD:2" unit="amperes"/>
          </Substract>
        </ToFixed>
      </Right>
    </Text>
  </EnginePage>

  <LeanPage>
    <Gauge>
      <Type>Circular</Type>
      <ID>Piston_RPMGauge</ID>
      <Style>
        <TextIncrement>10</TextIncrement>
        <ForceTextColor>white</ForceTextColor>
      </Style>
      <Title></Title>
      <Unit>RPM</Unit>
      <Minimum>0</Minimum>
      <Maximum>3000</Maximum>
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
        <Begin>2100</Begin>
        <End>
          <StateMachine>
            <State id="LowAlt" value="2500">
              <Transition to="MedAlt">
                <Greater>
                  <Simvar name="INDICATED ALTITUDE" unit="feet"/>
                  <Constant>5300</Constant>
                </Greater>
              </Transition>
            </State>
            <State id="MedAlt" value="2600">
              <Transition to="LowAlt">
                <Lower>
                  <Simvar name="INDICATED ALTITUDE" unit="feet"/>
                  <Constant>4700</Constant>
                </Lower>
              </Transition>
              <Transition to="HighAlt">
                <Greater>
                  <Simvar name="INDICATED ALTITUDE" unit="feet"/>
                  <Constant>10300</Constant>
                </Greater>
              </Transition>
            </State>
            <State id="HighAlt" value="2700">
              <Transition to="MedAlt">
                <Lower>
                  <Simvar name="INDICATED ALTITUDE" unit="feet"/>
                  <Constant>9700</Constant>
                </Lower>
              </Transition>
            </State>
          </StateMachine>
        </End>
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

    <Gauge>
      <Type>Cylinder</Type>
      <ID>EGT_Gauge</ID>
      <Title>EGT</Title>
      <Unit>°F</Unit>
      <Rows>13</Rows>
      <Columns>4</Columns>
      <Minimum>1300</Minimum>
      <Maximum>1600</Maximum>
      <TempOrder>4,2,1,3</TempOrder>
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
      <Columns>4</Columns>
      <Minimum>200</Minimum>
      <Maximum>500</Maximum>
      <TempOrder>4,2,1,3</TempOrder>
      <Value>
        <Simvar name="ENG CYLINDER HEAD TEMPERATURE:1" unit="farenheit"/>
      </Value>
      <Style>
        <ShowRedline>True</ShowRedline>
        <TextIncrement>5</TextIncrement>
      </Style>
    </Gauge>

    <Text>
      <Left fontsize="10">FFLOW GPH</Left>
      <Right fontsize="10">
        <ToFixed precision="1">
          <Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
        </ToFixed>
      </Right>
    </Text>

    <Gauge>
      <Style>
        <Margins>
          <Top>20</Top>
        </Margins>
      </Style>
      <Type>DoubleHorizontal</Type>
      <ID>Piston_FuelGauge</ID>
      <Title>Fuel QTY</Title>
      <Unit>GAL</Unit>
      <CursorText>R</CursorText>
      <CursorText2>L</CursorText2>
      <Minimum>0</Minimum>
      <Maximum>30</Maximum>
      <Value>
        <Simvar name="FUEL RIGHT QUANTITY" unit="gallons"/>
      </Value>
      <Value2>
        <Simvar name="FUEL LEFT QUANTITY" unit="gallons"/>
      </Value2>
      <ColorZone>
        <Color>red</Color>
        <Begin>0</Begin>
        <End>1.5</End>
      </ColorZone>
      <ColorZone>
        <Color>yellow</Color>
        <Begin>1.5</Begin>
        <End>5</End>
      </ColorZone>
      <ColorZone>
        <Color>green</Color>
        <Begin>5</Begin>
        <End>24</End>
      </ColorZone>
      <GraduationLength text="True">10</GraduationLength>
      <EndText>F</EndText>
    </Gauge>
  </LeanPage>

  <SystemPage>
    <Gauge>
      <Type>Circular</Type>
      <ID>Piston_RPMGauge</ID>
      <Style>
        <TextIncrement>10</TextIncrement>
        <ForceTextColor>white</ForceTextColor>
      </Style>
      <Title></Title>
      <Unit>RPM</Unit>
      <Minimum>0</Minimum>
      <Maximum>3000</Maximum>
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
        <Begin>2100</Begin>
        <End>
          <StateMachine>
            <State id="LowAlt" value="2500">
              <Transition to="MedAlt">
                <Greater>
                  <Simvar name="INDICATED ALTITUDE" unit="feet"/>
                  <Constant>5300</Constant>
                </Greater>
              </Transition>
            </State>
            <State id="MedAlt" value="2600">
              <Transition to="LowAlt">
                <Lower>
                  <Simvar name="INDICATED ALTITUDE" unit="feet"/>
                  <Constant>4700</Constant>
                </Lower>
              </Transition>
              <Transition to="HighAlt">
                <Greater>
                  <Simvar name="INDICATED ALTITUDE" unit="feet"/>
                  <Constant>10300</Constant>
                </Greater>
              </Transition>
            </State>
            <State id="HighAlt" value="2700">
              <Transition to="MedAlt">
                <Lower>
                  <Simvar name="INDICATED ALTITUDE" unit="feet"/>
                  <Constant>9700</Constant>
                </Lower>
              </Transition>
            </State>
          </StateMachine>
        </End>
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
      <Left fontsize="10">OIL PSI</Left>
      <Right fontsize="10">
        <ToFixed precision="1">
          <Simvar name="GENERAL ENG OIL PRESSURE:1" unit="psi"/>
        </ToFixed>
      </Right>
    </Text>

    <Text>
      <Left fontsize="10">OIL °F</Left>
      <Right fontsize="10">
        <ToFixed precision="0">
          <Simvar name="GENERAL ENG OIL TEMPERATURE:1" unit="farenheit"/>
        </ToFixed>
      </Right>
    </Text>

    <Text>
      <Style>
        <Margins>
          <Top>30</Top>
        </Margins>
      </Style>
      <Left>-------</Left>
      <Center>Fuel Calc</Center>
      <Right>-------</Right>
    </Text>

    <Text>
      <Left fontsize="10">FFLOW GPH</Left>
      <Right fontsize="10">
        <ToFixed precision="1">
          <Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
        </ToFixed>
      </Right>
    </Text>

    <Text>
      <Left fontsize="10">GAL Used</Left>
      <Right fontsize="10">
        <ToFixed precision="1">
          <Simvar name="L:WT1000_Fuel_GalBurned" unit="gallon"/>
        </ToFixed>
      </Right>
    </Text>

    <Text>
      <Left fontsize="10">GAL REM</Left>
      <Right fontsize="10">
        <ToFixed precision="1">
          <Simvar name="L:WT1000_Fuel_GalRemaining" unit="gallon"/>
        </ToFixed>
      </Right>
    </Text>

    <Gauge>
      <Style>
        <Margins>
          <Top>20</Top>
        </Margins>
      </Style>
      <Type>DoubleHorizontal</Type>
      <ID>Piston_FuelGauge</ID>
      <Title>Fuel QTY</Title>
      <Unit>GAL</Unit>
      <CursorText>R</CursorText>
      <CursorText2>L</CursorText2>
      <Minimum>0</Minimum>
      <Maximum>30</Maximum>
      <Value>
        <Simvar name="FUEL RIGHT QUANTITY" unit="gallons"/>
      </Value>
      <Value2>
        <Simvar name="FUEL LEFT QUANTITY" unit="gallons"/>
      </Value2>
      <ColorZone>
        <Color>red</Color>
        <Begin>0</Begin>
        <End>1.5</End>
      </ColorZone>
      <ColorZone>
        <Color>yellow</Color>
        <Begin>1.5</Begin>
        <End>5</End>
      </ColorZone>
      <ColorZone>
        <Color>green</Color>
        <Begin>5</Begin>
        <End>24</End>
      </ColorZone>
      <GraduationLength text="True">10</GraduationLength>
      <EndText>F</EndText>
    </Gauge>

    <Text>
      <Style>
        <Margins>
          <Top>30</Top>
        </Margins>
      </Style>
      <Left>--------</Left>
      <Center>Electrical</Center>
      <Right>--------</Right>
    </Text>

    <Text>
      <Left>M</Left>
      <Center fontsize="8">Bus</Center>
      <Right>E</Right>
    </Text>

    <Text>
      <Left id="Piston_Bus_M">
        <ToFixed precision="1">
          <Simvar name="ELECTRICAL MAIN BUS VOLTAGE:3" unit="volts"/>
        </ToFixed>
      </Left>
      <Center fontsize="8">Volts</Center>
      <Right id="Piston_Bus_E">
        <ToFixed precision="1">
          <Simvar name="ELECTRICAL MAIN BUS VOLTAGE:6" unit="volts"/>
        </ToFixed>
      </Right>
    </Text>

    <Text>
      <Left>M</Left>
      <Center fontsize="8">Battery</Center>
      <Right>S</Right>
    </Text>

    <Text>
      <Left id="Piston_Batt_M">
        <ToFixed precision="0">
          <Substract>
            <Constant>0</Constant>
            <Simvar name="ELECTRICAL BATTERY LOAD:1" unit="amperes"/>
          </Substract>
        </ToFixed>
      </Left>
      <Center fontsize="8">Amps</Center>
      <Right id="Piston_Batt_S">
        <ToFixed precision="0">
          <Substract>
            <Constant>0</Constant>
            <Simvar name="ELECTRICAL BATTERY LOAD:2" unit="amperes"/>
          </Substract>
        </ToFixed>
      </Right>
    </Text>
  </SystemPage>
</EngineDisplay>
`;
