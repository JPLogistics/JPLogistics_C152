export const xmlConfig = `
<EngineDisplay>
	<EnginePage>
		<Gauge>
			<Type>Circular</Type>
			<Style>
				<Margins>
					<Top>10</Top>
				</Margins>
			</Style>
			<ID>PWRGauge</ID>
			<Style>
				<BeginAngle>0</BeginAngle>
				<EndAngle>145</EndAngle>
				<CursorType>Triangle</CursorType>
				<ValuePos>End</ValuePos>
			</Style>
			<Title/>
			<Unit>% Pwr</Unit>
			<Minimum>0</Minimum>
			<Maximum>100</Maximum>
			<Value>
				<Max>
					<Min>
						<Multiply>
							<Divide>
								<Multiply>
									<Simvar name="ENG TORQUE:1" unit="Foot pounds"/>
									<Divide>
										<Simvar name="GENERAL ENG RPM:1" unit="rpm"/>
										<Constant>5252</Constant>
									</Divide>
									<Constant>550</Constant>
								</Multiply>
								<Divide>
									<Gamevar name="AIRCRAFT MAX RATED HP" unit="ft lb per second"/>
									<Simvar name="NUMBER OF ENGINES" unit="number"/>
								</Divide>
							</Divide>
							<Constant>100</Constant>
						</Multiply>
						<Constant>100</Constant>
					</Min>
					<Constant>0</Constant>
				</Max>
			</Value>
			<ColorZone>
				<Color>green</Color>
				<Begin>0</Begin>
				<End>100</End>
			</ColorZone>
			<BeginText></BeginText>
			<EndText></EndText>
		</Gauge>

		<Text>
			<Left>RPM</Left>
			<Right>
				<ToFixed precision="0">
					<Simvar name="GENERAL ENG RPM:1" unit="rpm"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left>Man "Hg</Left>
			<Right>
				<ToFixed precision="1">
					<Simvar name="RECIP ENG MANIFOLD PRESSURE:1" unit="inHG"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Center>----------------------------------</Center>
		</Text>

		<Gauge>
			<Type>DoubleHorizontal</Type>
			<ID>Piston_FuelGauge</ID>
			<Title>Fuel Qty</Title>
			<Unit>Gal</Unit>
			<CursorText>R</CursorText>
			<CursorText2>L</CursorText2>
			<Minimum>0</Minimum>
			<Maximum>40</Maximum>
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

		<Gauge>
			<Type>Horizontal</Type>
			<ID>FuelFlow_Gauge</ID>
			<Title>Fuel Flow</Title>
			<Unit>GPH</Unit>
			<Minimum>0</Minimum>
			<Maximum>30</Maximum>
			<Style>
				<ValuePos>End</ValuePos>
			</Style>
			<Value>
				<Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
			</Value>
			<ColorZone>
				<Begin>10</Begin>
				<End>20</End>
				<Color>green</Color>
			</ColorZone>
			<BeginText/>
			<EndText/>
		</Gauge>

		<Text>
			<Left fontsize="10">Gal Used</Left>
			<Right fontsize="10">
				<ToFixed precision="1">
					<Simvar name="L:WT1000_Fuel_GalBurned" unit="gallon"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Center>----------------------------------</Center>
		</Text>

		<Gauge>
			<Type>Horizontal</Type>
			<ID>OilTemp_Gauge</ID>
			<Title>Oil</Title>
			<Unit>°F</Unit>
			<Minimum>50</Minimum>
			<Maximum>245</Maximum>
			<Style>
				<ValuePos>End</ValuePos>
			</Style>
			<Value>
				<Simvar name="GENERAL ENG OIL TEMPERATURE:1" unit="farenheit"/>
			</Value>
			<ColorZone>
				<Color>green</Color>
				<Begin>100</Begin>
				<End>240</End>
			</ColorZone>
			<ColorLine>
				<Color>red</Color>
				<Position>240</Position>
			</ColorLine>
			<BeginText/>
			<EndText/>
			<RedBlink>
				<Greater>
					<Simvar name="GENERAL ENG OIL TEMPERATURE:1" unit="farenheit"/>
					<Constant>240</Constant>
				</Greater>
			</RedBlink>
		</Gauge>

		<Gauge>
			<Type>Horizontal</Type>
			<ID>OilPsi_Gauge</ID>
			<Title>Oil</Title>
			<Unit>PSI</Unit>
			<Minimum>0</Minimum>
			<Maximum>102</Maximum>			<!-- Not Sure -->
			<Style>
				<ValuePos>End</ValuePos>
			</Style>
			<Value>
				<Simvar name="GENERAL ENG OIL PRESSURE:1" unit="psi"/>
			</Value>
			<ColorLine>
				<Color>red</Color>
				<Position>10</Position>
			</ColorLine>
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
				<Color>yellow</Color>
				<Begin>60</Begin>
				<End>100</End>
			</ColorZone>
			<ColorLine>
				<Color>red</Color>
				<Position>100</Position>
			</ColorLine>
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
						<Constant>25</Constant>
					</Lower>
				</Or>
			</RedBlink>
		</Gauge>

		<Text>
			<Center>----------------------------------</Center>
		</Text>

		<Text>
			<Left fontsize="10">Batt1 A</Left>
			<Right fontsize="10">
				<ToFixed precision="0">
					<Substract>
						<Constant>0</Constant>
						<Simvar name="ELECTRICAL BATTERY LOAD" unit="Amperes"/>
					</Substract>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left fontsize="10">Ess Bus V</Left>
			<Right fontsize="10">
				<ToFixed precision="1">
					<Simvar name="ELECTRICAL MAIN BUS VOLTAGE:2" unit="volts"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Center>----------------------------------</Center>
		</Text>

		<Text>
			<Left>CHT °F</Left>
			<Right>
				<ToFixed precision="0">
					<Simvar name="ENG CYLINDER HEAD TEMPERATURE:1" unit="farenheit"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left>EGT °F</Left>
			<Right>
				<ToFixed precision="0">
					<Simvar name="ENG EXHAUST GAS TEMPERATURE:1" unit="farenheit"/>
				</ToFixed>
			</Right>
		</Text>
	</EnginePage>

	<LeanPage>
		<Gauge>
			<Type>Circular</Type>
			<ID>PWRGauge</ID>
			<Style>
				<BeginAngle>0</BeginAngle>
				<EndAngle>145</EndAngle>
				<CursorType>Triangle</CursorType>
				<ValuePos>End</ValuePos>
			</Style>
			<Title/>
			<Unit>% Pwr</Unit>
			<Minimum>0</Minimum>
			<Maximum>100</Maximum>
			<Value>
				<Max>
					<Min>
						<Multiply>
							<Divide>
								<Multiply>
									<Simvar name="ENG TORQUE:1" unit="Foot pounds"/>
									<Divide>
										<Simvar name="GENERAL ENG RPM:1" unit="rpm"/>
										<Constant>5252</Constant>
									</Divide>
									<Constant>550</Constant>
								</Multiply>
								<Divide>
									<Gamevar name="AIRCRAFT MAX RATED HP" unit="ft lb per second"/>
									<Simvar name="NUMBER OF ENGINES" unit="number"/>
								</Divide>
							</Divide>
							<Constant>100</Constant>
						</Multiply>
						<Constant>100</Constant>
					</Min>
					<Constant>0</Constant>
				</Max>
			</Value>
			<ColorZone>
				<Color>green</Color>
				<Begin>0</Begin>
				<End>100</End>
			</ColorZone>
			<BeginText></BeginText>
			<EndText></EndText>
		</Gauge>

		<Gauge>
			<Type>Cylinder</Type>
			<Style>
				<Margins>
					<Top>10</Top>
				</Margins>
				<ShowPeak>True</ShowPeak>
				<TextIncrement>5</TextIncrement>
			</Style>
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

		<Text>
			<Left fontsize="10">Fuel GPH</Left>
			<Right fontsize="10">
				<ToFixed precision="1">
					<Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
				</ToFixed>
			</Right>
		</Text>

		<Gauge>
			<Type>DoubleHorizontal</Type>
			<ID>Piston_FuelGauge</ID>
			<Title>Fuel Qty</Title>
			<Unit>Gal</Unit>
			<CursorText>R</CursorText>
			<CursorText2>L</CursorText2>
			<Minimum>0</Minimum>
			<Maximum>40</Maximum>
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
			<ID>PWRGauge</ID>
			<Style>
				<BeginAngle>0</BeginAngle>
				<EndAngle>145</EndAngle>
				<CursorType>Triangle</CursorType>
				<ValuePos>End</ValuePos>
			</Style>
			<Title/>
			<Unit>% Pwr</Unit>
			<Minimum>0</Minimum>
			<Maximum>100</Maximum>
			<Value>
				<Max>
					<Min>
						<Multiply>
							<Divide>
								<Multiply>
									<Simvar name="ENG TORQUE:1" unit="Foot pounds"/>
									<Divide>
										<Simvar name="GENERAL ENG RPM:1" unit="rpm"/>
										<Constant>5252</Constant>
									</Divide>
									<Constant>550</Constant>
								</Multiply>
								<Divide>
									<Gamevar name="AIRCRAFT MAX RATED HP" unit="ft lb per second"/>
									<Simvar name="NUMBER OF ENGINES" unit="number"/>
								</Divide>
							</Divide>
							<Constant>100</Constant>
						</Multiply>
						<Constant>100</Constant>
					</Min>
					<Constant>0</Constant>
				</Max>
			</Value>
			<ColorZone>
				<Color>green</Color>
				<Begin>0</Begin>
				<End>100</End>
			</ColorZone>
			<BeginText></BeginText>
			<EndText></EndText>
		</Gauge>

		<Text>
			<Center>
				<Content>-</Content>
				<Color>black</Color>
			</Center>
		</Text>

		<Text>
			<Left fontsize="10">Oil PSI</Left>
			<Right fontsize="10">
				<ToFixed precision="1">
					<Simvar name="GENERAL ENG OIL PRESSURE:1" unit="psi"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left fontsize="10">Oil °F</Left>
			<Right fontsize="10">
				<ToFixed precision="1">
					<Simvar name="GENERAL ENG OIL TEMPERATURE:1" unit="farenheit"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Style>
				<Margins>
					<Top>20</Top>
				</Margins>
			</Style>
			<Left>---</Left>
			<Center>Fuel Calc</Center>
			<Right>---</Right>
		</Text>

		<Text>
			<Left fontsize="10">Fuel GPH</Left>
			<Right fontsize="10">
				<ToFixed precision="1">
					<Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left fontsize="10">Gal Used</Left>
			<Right fontsize="10">
				<ToFixed precision="1">
					<Simvar name="L:WT1000_Fuel_GalBurned" unit="gallon"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left fontsize="10">Gal Rem</Left>
			<Right fontsize="10">
				<ToFixed precision="1">
					<Simvar name="L:WT1000_Fuel_GalRemaining" unit="gallon"/>
				</ToFixed>
			</Right>
		</Text>

		<Gauge>
			<Type>DoubleHorizontal</Type>
			<ID>Piston_FuelGauge</ID>
			<Title>Fuel Qty</Title>
			<Unit>Gal</Unit>
			<CursorText>R</CursorText>
			<CursorText2>L</CursorText2>
			<Minimum>0</Minimum>
			<Maximum>40</Maximum>
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
				</Margins>
			</Style>
			<Left>---</Left>
			<Center>Electrical</Center>
			<Right>--</Right>
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
			<Center fontsize="8">Batt</Center>
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

		<Text>
			<Style>
				<Margins>
					<Top>20</Top>
				</Margins>
			</Style>
			<Left>---</Left>
			<Center>Air Data</Center>
			<Right>--</Right>
		</Text>

		<Text>
			<Left fontsize="8">Density Alt</Left>
			<Right>
				<ToFixed precision="0">
					<Add>
						<Simvar name="PRESSURE ALTITUDE" unit="feet"/>
						<Multiply>
							<Constant>120</Constant>
							<Substract>
								<Simvar name="AMBIENT TEMPERATURE" unit="celsius"/>
								<Substract>
									<Constant>15</Constant>
									<Divide>
										<Simvar name="PRESSURE ALTITUDE" unit="feet"/>
										<Constant>500</Constant>
									</Divide>
								</Substract>
							</Substract>
						</Multiply>
					</Add>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left fontsize="8">OAT</Left>
			<Center>
				<ToFixed precision="0">
					<Simvar name="AMBIENT TEMPERATURE" unit="celsius"/>
				</ToFixed>
			</Center>
			<Right fontsize="8">°C</Right>
		</Text>

		<Text>
			<Left fontsize="8">ISA</Left>
			<Center>
				<ToFixed precision="0">
					<Substract>
						<Simvar name="AMBIENT TEMPERATURE" unit="celsius"/>
						<Substract>
							<Constant>15</Constant>
							<Divide>
								<Simvar name="PRESSURE ALTITUDE" unit="feet"/>
								<Constant>500</Constant>
							</Divide>
						</Substract>
					</Substract>
				</ToFixed>
			</Center>
			<Right fontsize="8">°C</Right>
		</Text>
	</SystemPage>
</EngineDisplay>
`;