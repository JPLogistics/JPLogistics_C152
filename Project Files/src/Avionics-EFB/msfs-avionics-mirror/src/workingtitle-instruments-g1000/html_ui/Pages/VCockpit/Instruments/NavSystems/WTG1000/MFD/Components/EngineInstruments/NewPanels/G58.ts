export const xmlConfig = `
<EngineDisplay>
	<EnginePage>
		<Gauge>
			<Type>DoubleVertical</Type>
			<Style>
				<Height>70</Height>
			</Style>
			<ID>Piston_ManifoldGauge</ID>
			<Title>MAN</Title>
			<Unit></Unit>
			<Minimum>10</Minimum>
			<Maximum>35</Maximum>
			<Value>
				<Simvar name="ENG MANIFOLD PRESSURE:1" unit="inHg"/>
			</Value>
			<Value2>
				<Simvar name="ENG MANIFOLD PRESSURE:2" unit="inHg"/>
			</Value2>
			<ColorZone>
				<Color>white</Color>
				<Begin>10</Begin>
				<End>15</End>
			</ColorZone>
			<ColorZone>
				<Color>green</Color>
				<Begin>15</Begin>
				<End>29.6</End>
			</ColorZone>
			<ColorZone>
				<Color>white</Color>
				<Begin>29.6</Begin>
				<End>35</End>
			</ColorZone>
			<GraduationLength text="False">5</GraduationLength>
		</Gauge>

		<Gauge>
			<Type>DoubleVertical</Type>
			<Style>
				<Height>70</Height>
				<TextIncrement>10</TextIncrement>
			</Style>
			<ID>Piston_RPMGauge</ID>
			<Title></Title>
			<Unit>RPM</Unit>
			<Minimum>0</Minimum>
			<Maximum>3000</Maximum>
			<Value>
				<Simvar name="PROP RPM:1" unit="rpm"/>
			</Value>
			<Value2>
				<Simvar name="PROP RPM:2" unit="rpm"/>
			</Value2>
			<ColorZone>
				<Color>white</Color>
				<Begin>0</Begin>
				<End>1800</End>
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
			<GraduationLength text="False">500</GraduationLength>
		</Gauge>

		<Text>
			<Center>FFLOW</Center>
		</Text>

		<Text>
			<Left>
				<ToFixed precision="1">
					<Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
				</ToFixed>
			</Left>
			<Center>GPH</Center>
			<Right>
				<ToFixed precision="1">
					<Simvar name="ENG FUEL FLOW GPH:2" unit="gallons per hour"/>
				</ToFixed>
			</Right>
		</Text>

		<Gauge>
			<Type>DoubleHorizontal</Type>
			<ID>Piston_FuelFlow</ID>
			<Title></Title>
			<Unit></Unit>
			<CursorText>L</CursorText>
			<CursorText2>R</CursorText2>
			<Minimum>0</Minimum>			<!-- Not Sure -->
			<Maximum>30</Maximum>			<!-- Not Sure -->
			<Value>
				<Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
			</Value>
			<Value2>
				<Simvar name="ENG FUEL FLOW GPH:2" unit="gallons per hour"/>
			</Value2>
			<ColorZone>
				<Color>green</Color>
				<Begin>3</Begin>
				<End>27.4</End>
			</ColorZone>
			<ColorZone>
				<Color>red</Color>
				<Begin>27.4</Begin>
				<End>30</End>				<!-- Not Sure -->
			</ColorZone>
			<GraduationLength text="False">5</GraduationLength>
		</Gauge>

		<Gauge>
			<Type>DoubleHorizontal</Type>
			<ID>Piston_CylinderHeadTemp</ID>
			<Title>CHT</Title>
			<Unit></Unit>
			<CursorText>L</CursorText>
			<CursorText2>R</CursorText2>
			<Minimum>0</Minimum>			<!-- Not Sure -->
			<Maximum>250</Maximum>			<!-- Not Sure -->
			<Value>
				<Simvar name="ENG CYLINDER HEAD TEMPERATURE:1" unit="celsius"/>
			</Value>
			<Value2>
				<Simvar name="ENG CYLINDER HEAD TEMPERATURE:2" unit="celsius"/>
			</Value2>
			<ColorZone>
				<Color>green</Color>
				<Begin>116</Begin>
				<End>238</End>
			</ColorZone>
			<ColorZone>
				<Color>red</Color>
				<Begin>238</Begin>
				<End>250</End>				<!-- Not Sure -->
			</ColorZone>
			<BeginText></BeginText>
			<EndText></EndText>
		</Gauge>

		<Gauge>
			<Type>DoubleHorizontal</Type>
			<ID>Piston_OilTempGauge</ID>
			<Title>Oil Temp</Title>
			<Unit></Unit>
			<CursorText>L</CursorText>
			<CursorText2>R</CursorText2>
			<Minimum>0</Minimum>			<!-- Not Sure -->
			<Maximum>120</Maximum>			<!-- Not Sure -->
			<Value>
				<Simvar name="GENERAL ENG OIL TEMPERATURE:1" unit="celsius"/>
			</Value>
			<Value2>
				<Simvar name="GENERAL ENG OIL TEMPERATURE:2" unit="celsius"/>
			</Value2>
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
				<End>120</End>				<!-- Not Sure -->
			</ColorZone>
			<BeginText></BeginText>
			<EndText></EndText>
		</Gauge>

		<Gauge>
			<Type>DoubleHorizontal</Type>
			<ID>Piston_OilPressGauge</ID>
			<Title>Oil Pres</Title>
			<Unit></Unit>
			<CursorText>L</CursorText>
			<CursorText2>R</CursorText2>
			<Minimum>0</Minimum>			<!-- Not Sure -->
			<Maximum>200</Maximum>			<!-- Not Sure -->
			<Value>
				<Simvar name="GENERAL ENG OIL PRESSURE:1" unit="psi"/>
			</Value>
			<Value2>
				<Simvar name="GENERAL ENG OIL PRESSURE:2" unit="psi"/>
			</Value2>
			<ColorZone>
				<Color>red</Color>
				<Begin>0</Begin>				<!-- Not Sure -->
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
				<End>105</End>				<!-- Not Sure -->
			</ColorZone>
			<BeginText></BeginText>
			<EndText></EndText>
		</Gauge>

		<Gauge>
			<Type>DoubleHorizontal</Type>
			<ID>Piston_AlternatorLoad</ID>
			<Title>Alt Load</Title>
			<Unit></Unit>
			<CursorText>L</CursorText>
			<CursorText2>R</CursorText2>
			<Minimum>0</Minimum>			<!-- Not Sure -->
			<Maximum>110</Maximum>			<!-- Not Sure -->
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
				<End>110</End>
			</ColorZone>
			<BeginText></BeginText>
			<EndText></EndText>
		</Gauge>

		<Gauge>
			<Type>DoubleHorizontal</Type>
			<ID>Piston_FuelGauge</ID>
			<Title>Fuel Qty</Title>
			<Unit>Gal</Unit>
			<CursorText>L</CursorText>
			<CursorText2>R</CursorText2>
			<Minimum>0</Minimum>
			<Maximum>75</Maximum>
			<Value>
				<Simvar name="FUEL LEFT QUANTITY" unit="gallons"/>
			</Value>
			<Value2>
				<Simvar name="FUEL RIGHT QUANTITY" unit="gallons"/>
			</Value2>
			<ColorZone>
				<Color>red</Color>
				<Begin>0</Begin>
				<End>1</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>1</Begin>
				<End>13</End>
			</ColorZone>
			<ColorZone>
				<Color>green</Color>
				<Begin>13</Begin>
				<End>75</End>
			</ColorZone>
			<GraduationLength text="False">10</GraduationLength>
		</Gauge>
	</EnginePage>

	<LeanPage>
		<Gauge>
			<Type>DoubleVertical</Type>
			<Style>
				<Height>70</Height>
			</Style>
			<ID>Piston_ManifoldGauge</ID>
			<Title>MAN</Title>
			<Unit></Unit>
			<Minimum>10</Minimum>
			<Maximum>35</Maximum>
			<Value>
				<Simvar name="ENG MANIFOLD PRESSURE:1" unit="inHg"/>
			</Value>
			<Value2>
				<Simvar name="ENG MANIFOLD PRESSURE:2" unit="inHg"/>
			</Value2>
			<ColorZone>
				<Color>white</Color>
				<Begin>10</Begin>
				<End>15</End>
			</ColorZone>
			<ColorZone>
				<Color>green</Color>
				<Begin>15</Begin>
				<End>29.6</End>
			</ColorZone>
			<ColorZone>
				<Color>white</Color>
				<Begin>29.6</Begin>
				<End>35</End>
			</ColorZone>
			<GraduationLength text="False">5</GraduationLength>
		</Gauge>

		<Gauge>
			<Type>DoubleVertical</Type>
			<Style>
				<Height>70</Height>
				<TextIncrement>10</TextIncrement>
			</Style>
			<ID>Piston_RPMGauge</ID>
			<Title></Title>
			<Unit>RPM</Unit>
			<Minimum>0</Minimum>
			<Maximum>3000</Maximum>
			<Value>
				<Simvar name="PROP RPM:1" unit="rpm"/>
			</Value>
			<Value2>
				<Simvar name="PROP RPM:2" unit="rpm"/>
			</Value2>
			<ColorZone>
				<Color>white</Color>
				<Begin>0</Begin>
				<End>1800</End>
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
			<GraduationLength text="False">500</GraduationLength>
		</Gauge>

		<Text>
			<Center>FFLOW</Center>
		</Text>

		<Text>
			<Left>
				<ToFixed precision="1">
					<Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
				</ToFixed>
			</Left>
			<Center>GPH</Center>
			<Right>
				<ToFixed precision="1">
					<Simvar name="ENG FUEL FLOW GPH:2" unit="gallons per hour"/>
				</ToFixed>
			</Right>
		</Text>

		<Gauge>
			<Type>TwinCylinder</Type>
			<Style>
				<Margins>
					<Bottom>10</Bottom>
				</Margins>
				<ShowPeak>True</ShowPeak>
				<TextIncrement>5</TextIncrement>
			</Style>
			<ID>EGT_Gauge</ID>
			<Title>EGT</Title>
			<Unit>°F</Unit>
			<Rows>13</Rows>
			<Columns>6</Columns>
			<Minimum>1300</Minimum>
			<Maximum>1600</Maximum>
			<TempOrder>1,4,2,5,3,6</TempOrder>
			<Value>
				<Simvar name="GENERAL ENG EXHAUST GAS TEMPERATURE:1" unit="farenheit"/>
			</Value>
			<Value2>
				<Simvar name="GENERAL ENG EXHAUST GAS TEMPERATURE:2" unit="farenheit"/>
			</Value2>
		</Gauge>

		<Gauge>
			<Type>TwinCylinder</Type>
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
			<Value2>
				<Simvar name="ENG CYLINDER HEAD TEMPERATURE:2" unit="farenheit"/>
			</Value2>
			<Style>
				<ShowPeak>True</ShowPeak>
				<TextIncrement>5</TextIncrement>
			</Style>
		</Gauge>
	</LeanPage>

	<SystemPage>
		<Gauge>
			<Type>DoubleVertical</Type>
			<Style>
				<Height>70</Height>
			</Style>
			<ID>Piston_ManifoldGauge</ID>
			<Title>MAN</Title>
			<Unit></Unit>
			<Minimum>10</Minimum>
			<Maximum>35</Maximum>
			<Value>
				<Simvar name="ENG MANIFOLD PRESSURE:1" unit="inHg"/>
			</Value>
			<Value2>
				<Simvar name="ENG MANIFOLD PRESSURE:2" unit="inHg"/>
			</Value2>
			<ColorZone>
				<Color>white</Color>
				<Begin>10</Begin>
				<End>15</End>
			</ColorZone>
			<ColorZone>
				<Color>green</Color>
				<Begin>15</Begin>
				<End>29.6</End>
			</ColorZone>
			<ColorZone>
				<Color>white</Color>
				<Begin>29.6</Begin>
				<End>35</End>
			</ColorZone>
			<GraduationLength text="False">5</GraduationLength>
		</Gauge>

		<Gauge>
			<Type>DoubleVertical</Type>
			<Style>
				<Height>70</Height>
				<TextIncrement>10</TextIncrement>
			</Style>
			<ID>Piston_RPMGauge</ID>
			<Title></Title>
			<Unit>RPM</Unit>
			<Minimum>0</Minimum>
			<Maximum>3000</Maximum>
			<Value>
				<Simvar name="PROP RPM:1" unit="rpm"/>
			</Value>
			<Value2>
				<Simvar name="PROP RPM:2" unit="rpm"/>
			</Value2>
			<ColorZone>
				<Color>white</Color>
				<Begin>0</Begin>
				<End>1800</End>
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
			<GraduationLength text="False">500</GraduationLength>
		</Gauge>

		<Text>
			<Left>----------</Left>
			<Center>System</Center>
			<Right>----------</Right>
		</Text>

		<Text>
			<Left>L</Left>
			<Center>Oil</Center>
			<Right>R</Right>
		</Text>

		<Text>
			<Left>
				<ToFixed precision="0">
					<Simvar name="GENERAL ENG OIL TEMPERATURE:1" unit="farenheit"/>
				</ToFixed>
			</Left>
			<Center>°F</Center>
			<Right>
				<ToFixed precision="0">
					<Simvar name="GENERAL ENG OIL TEMPERATURE:2" unit="farenheit"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Center>PSI</Center>
		</Text>

		<Text>
			<Left>
				<ToFixed precision="1">
					<Simvar name="GENERAL ENG OIL PRESSURE:1" unit="psi"/>
				</ToFixed>
			</Left>
			<Right>
				<ToFixed precision="1">
					<Simvar name="GENERAL ENG OIL PRESSURE:1" unit="psi"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left>--------</Left>
			<Center>Fuel Calc</Center>
			<Right>--------</Right>
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
			<Left>--------</Left>
			<Center>Electrical</Center>
			<Right>--------</Right>
		</Text>

		<Text>
			<Left>L</Left>
			<Center>Alt Load</Center>
			<Right>R</Right>
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
			<Left>L</Left>
			<Center>Bus Volts</Center>
			<Right>R</Right>
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